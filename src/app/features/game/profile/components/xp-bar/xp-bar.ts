import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { levelProgress } from '../../data/progression.data';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-xp-bar',
  imports: [],
  templateUrl: './xp-bar.html',
  styleUrl: './xp-bar.scss',
})
export class XpBarComponent {
  readonly experience = input.required<number>();

  readonly progress = computed(() => levelProgress(this.experience()));
}
