import { Component, input, output } from '@angular/core';
import { Question } from '../../models/question.model';

@Component({
  selector: 'app-question-card',
  imports: [],
  templateUrl: './question-card.html',
  styleUrl: './question-card.scss',
})
export class QuestionCardComponent {
  private readonly optionLabels = ['A', 'B', 'C', 'D'] as const;

  readonly question = input.required<Question>();
  readonly answerSelected = output<number>();

  optionLabel(index: number): string {
    return this.optionLabels[index] ?? '';
  }

  selectOption(optionIndex: number): void {
    this.answerSelected.emit(optionIndex);
  }
}
