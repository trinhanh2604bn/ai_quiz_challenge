import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { avatarById } from '../../../game/profile/data/avatars.data';
import { LeaderboardEntry } from '../../models/leaderboard-entry.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-leaderboard',
  imports: [],
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.scss',
})
export class LeaderboardComponent {
  readonly entries = input.required<readonly LeaderboardEntry[]>();
  readonly appearance = input<'classic' | 'ranking' | 'modal'>('classic');

  formatCompletedAt(completedAt: number): string {
    return new Date(completedAt).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  avatarGlyph(entry: LeaderboardEntry): string {
    const avatar = entry.avatarId ? avatarById(entry.avatarId) : null;
    if (avatar) {
      return avatar.glyph;
    }

    const letter = entry.playerName.trim().charAt(0).toUpperCase();
    return letter || '?';
  }
}
