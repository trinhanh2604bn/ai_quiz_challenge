import { Component, input, output } from '@angular/core';
import { Question } from '../../models/question.model';

type AnswerOptionState = 'default' | 'correct' | 'incorrect' | 'reveal';

@Component({
  selector: 'app-question-card',
  imports: [],
  templateUrl: './question-card.html',
  styleUrl: './question-card.scss',
})
export class QuestionCardComponent {
  private readonly optionLabels = ['A', 'B', 'C', 'D'] as const;

  readonly question = input.required<Question>();
  readonly selectedIndex = input<number | null>(null);
  readonly answerSelected = output<number>();

  isLocked(): boolean {
    return this.selectedIndex() !== null;
  }

  optionLabel(index: number): string {
    return this.optionLabels[index] ?? '';
  }

  optionState(index: number): AnswerOptionState {
    const selected = this.selectedIndex();
    if (selected === null) {
      return 'default';
    }

    const correctIndex = this.question().correctIndex;
    if (index === selected && index === correctIndex) {
      return 'correct';
    }

    if (index === selected) {
      return 'incorrect';
    }

    if (index === correctIndex) {
      return 'reveal';
    }

    return 'default';
  }

  selectOption(optionIndex: number): void {
    if (this.isLocked()) {
      return;
    }

    this.answerSelected.emit(optionIndex);
  }
}
