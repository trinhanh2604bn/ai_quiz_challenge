import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LeaderboardComponent } from '../../../quiz/components/leaderboard/leaderboard';
import { LeaderboardService } from '../../../quiz/services/leaderboard.service';
import {
  AchievementService,
  battleAchievementFacts,
} from '../../achievements/services/achievement.service';
import { ProfileService, battleProgressFacts } from '../../profile/services/profile.service';
import { avatarById } from '../../profile/data/avatars.data';
import { RankingService } from '../../ranking/services/ranking.service';
import { BattlePlayer } from '../../models/battle-player.model';
import { BattleSession } from '../../models/battle-session.model';
import { BattleService } from '../../services/battle.service';
import { GameService } from '../../services/game.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-battle-result',
  imports: [LeaderboardComponent],
  templateUrl: './battle-result.html',
  styleUrl: './battle-result.scss',
})
export class BattleResultComponent implements OnInit {
  private readonly battle = inject(BattleService);
  private readonly game = inject(GameService);
  private readonly leaderboard = inject(LeaderboardService);
  private readonly achievements = inject(AchievementService);
  private readonly profiles = inject(ProfileService);
  private readonly rankings = inject(RankingService);
  private readonly router = inject(Router);

  readonly session = this.battle.session;
  readonly entries = this.leaderboard.entries;
  readonly leaderboardOpen = signal(false);
  readonly celebrateSrc = 'game/home/mascot-celebrate.png';
  readonly idleSrc = 'game/home/mascot-idle.png';
  readonly trophySrc = 'game/home/icon-achievements.png';
  readonly totalQuestions = computed(() => this.session()?.questions.length ?? 0);
  readonly winner = computed(() => {
    const session = this.session();
    if (!session) {
      return null;
    }

    return calculateWinner(session.players);
  });
  readonly outcome = computed(() => {
    const winner = this.winner();
    if (!this.session()) {
      return '';
    }

    if (!winner) {
      return 'Draw';
    }

    return `${winner.name} wins.`;
  });

  ngOnInit(): void {
    const session = this.battle.session();
    if (!session) {
      void this.router.navigate(['/battle/setup']);
      return;
    }

    if (session.state !== 'completed') {
      void this.router.navigate(['/battle']);
      return;
    }

    const facts = battleAchievementFacts(
      session,
      calculateWinner(session.players) !== null,
    );
    const unlocked = this.achievements.recordBattleCompletion(facts);
    this.profiles.recordBattleCompletion(battleProgressFacts(session, facts.signature));
    this.profiles.recordAchievementUnlocks(unlocked.map((item) => item.id));
    this.savePlayers(session);
    this.recordRanking(session, facts.signature);
  }

  accuracyFor(correctAnswers: number): number {
    return accuracyPercent(correctAnswers, this.totalQuestions());
  }

  avatarGlyph(player: BattlePlayer): string {
    if (player.id === 'player-1') {
      const profile = this.profiles.profile();
      const avatar = profile ? avatarById(profile.avatarId) : null;
      if (avatar) {
        return avatar.glyph;
      }
    }

    const letter = player.name.trim().charAt(0).toUpperCase();
    return letter || '?';
  }

  toggleLeaderboard(): void {
    this.leaderboardOpen.update((open) => !open);
  }

  playAgain(): void {
    this.battle.resetBattle();
    void this.router.navigate(['/battle/setup']);
  }

  exitBattle(): void {
    this.battle.resetBattle();
    this.game.resetGame();
    void this.router.navigate(['/']);
  }

  private recordRanking(session: BattleSession, signature: string): void {
    const category = session.questions[0]?.category;
    const source = signature.trim();
    if (!category || source.length === 0) {
      return;
    }

    const recordedAt = Date.now();
    const profile = this.profiles.profile();
    for (const player of session.players) {
      const identity = profile !== null && player.id === 'player-1' ? profile : null;
      this.rankings.recordResult({
        sourceId: `battle:${source}:${player.id}`,
        player: identity ? identity.nickname : player.name,
        avatarId: identity ? identity.avatarId : '',
        level: identity ? identity.level : 1,
        experience: identity ? identity.experience : 0,
        score: player.score,
        category,
        mode: 'two-player',
        recordedAt,
      });
    }
  }

  private savePlayers(session: BattleSession): void {
    const completedAt = Date.now();
    const total = session.questions.length;
    const identity = this.profiles.profile();
    for (const player of session.players) {
      const isLocalPlayer = identity !== null && player.id === 'player-1';
      this.leaderboard.addEntry({
        playerName: player.name,
        score: player.score,
        accuracy: accuracyPercent(player.correctAnswers, total),
        completedAt,
        mode: 'two-player',
        ...(isLocalPlayer ? { avatarId: identity.avatarId, level: identity.level } : {}),
      });
    }
  }
}

export function calculateWinner(
  players: readonly [BattlePlayer, BattlePlayer],
): BattlePlayer | null {
  const [first, second] = players;
  if (first.score === second.score) {
    return null;
  }

  return first.score > second.score ? first : second;
}

export function accuracyPercent(correctAnswers: number, totalQuestions: number): number {
  if (totalQuestions === 0) {
    return 0;
  }

  return Math.round((correctAnswers / totalQuestions) * 100);
}
