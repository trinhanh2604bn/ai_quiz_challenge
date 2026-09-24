import { Component, input } from '@angular/core';
import { LeaderboardEntry } from '../../models/leaderboard-entry.model';

@Component({
  selector: 'app-leaderboard',
  imports: [],
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.scss',
})
export class LeaderboardComponent {
  readonly entries = input.required<readonly LeaderboardEntry[]>();

  formatCompletedAt(completedAt: number): string {
    return new Date(completedAt).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}
