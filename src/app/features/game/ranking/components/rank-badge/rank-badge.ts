import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RankTier } from '../../models/rank-tier.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-rank-badge',
  imports: [],
  templateUrl: './rank-badge.html',
  styleUrl: './rank-badge.scss',
})
export class RankBadgeComponent {
  readonly tier = input.required<RankTier>();

  readonly tierKey = computed(() => this.tier().replace(' AI', '').toLowerCase());
}
