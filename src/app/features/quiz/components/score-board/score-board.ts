import { Component, input } from '@angular/core';

@Component({
  selector: 'app-score-board',
  imports: [],
  templateUrl: './score-board.html',
  styleUrl: './score-board.scss',
})
export class ScoreBoardComponent {
  readonly score = input.required<number>();
  readonly correctCount = input.required<number>();
  readonly streak = input.required<number>();
  readonly multiplier = input.required<number>();
}
