import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { avatarById } from '../../data/avatars.data';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-profile-card',
  imports: [],
  templateUrl: './profile-card.html',
  styleUrl: './profile-card.scss',
})
export class ProfileCardComponent {
  readonly nickname = input.required<string>();
  readonly avatarId = input.required<string>();
  readonly level = input.required<number>();

  readonly glyph = computed(() => {
    const avatar = avatarById(this.avatarId());
    if (avatar) {
      return avatar.glyph;
    }

    const letter = this.nickname().trim().charAt(0).toUpperCase();
    return letter || '?';
  });
}
