import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Season } from '../../models/season.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-season-card',
  imports: [],
  templateUrl: './season-card.html',
  styleUrl: './season-card.scss',
})
export class SeasonCardComponent {
  readonly season = input.required<Season>();

  formatDate(timestamp: number): string {
    if (!Number.isFinite(timestamp) || timestamp <= 0) {
      return 'Unknown';
    }

    return new Date(timestamp).toLocaleDateString();
  }
}
