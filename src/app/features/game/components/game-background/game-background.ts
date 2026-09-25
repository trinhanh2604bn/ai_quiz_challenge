import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-game-background',
  imports: [],
  templateUrl: './game-background.html',
  styleUrl: './game-background.scss',
})
export class GameBackgroundComponent {}
