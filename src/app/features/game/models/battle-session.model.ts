import { Question } from '../../quiz/models/question.model';
import { BattlePlayer } from './battle-player.model';
import { BattleState } from './battle-state.model';

export interface BattleSession {
  players: readonly [BattlePlayer, BattlePlayer];
  questions: readonly Question[];
  currentQuestionIndex: number;
  currentPlayerIndex: 0 | 1;
  state: BattleState;
  winner: BattlePlayer | null;
}
