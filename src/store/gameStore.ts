import { create } from 'zustand';
import {
  applyMove,
  cloneSnapshot,
  createEmptySnapshot,
  GameMode,
  GameSnapshot,
  getAiMove,
  getAllowedCells,
  getAllowedBoards,
  getBoardStatus,
  getGlobalWinner,
  getSmallBoardResult,
  Player,
} from '../gameLogic';

export interface GameState {
  snapshot: GameSnapshot;
  history: GameSnapshot[];
  historyIndex: number;
  scores: { X: number; O: number; draws: number };
  mode: GameMode;
  darkMode: boolean;
  showRules: boolean;
  aiThinking: boolean;
  soundEnabled: boolean;
  hintEnabled: boolean;
  resetGame: () => void;
  playMove: (board: number, cell: number) => void;
  undo: () => void;
  redo: () => void;
  setMode: (mode: GameMode) => void;
  toggleTheme: () => void;
  toggleRules: () => void;
  toggleSound: () => void;
  toggleHint: () => void;
}

const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('utt-theme') : null;
const savedScore = typeof window !== 'undefined' ? localStorage.getItem('utt-scores') : null;

const initialScores = savedScore ? JSON.parse(savedScore) : { X: 0, O: 0, draws: 0 };

export const useGameStore = create<GameState>((set, get) => ({
  snapshot: createEmptySnapshot(),
  history: [createEmptySnapshot()],
  historyIndex: 0,
  scores: initialScores,
  mode: 'pvp',
  darkMode: savedTheme !== 'light',
  showRules: true,
  aiThinking: false,
  soundEnabled: true,
  hintEnabled: true,
  resetGame: () => {
    const next = createEmptySnapshot();
    set({ snapshot: next, history: [next], historyIndex: 0, aiThinking: false });
  },
  playMove: (board, cell) => {
    const state = get();
    const current = state.snapshot;
    if (current.globalWinner) return;
    const updated = applyMove(current, board, cell);
    if (updated === current) return;

    const nextHistory = state.history.slice(0, state.historyIndex + 1);
    nextHistory.push(cloneSnapshot(updated));

    const scores = { ...state.scores };
    if (updated.globalWinner) {
      if (updated.globalWinner === 'X') scores.X += 1;
      else if (updated.globalWinner === 'O') scores.O += 1;
      else scores.draws += 1;
      localStorage.setItem('utt-scores', JSON.stringify(scores));
    }

    set({ snapshot: updated, history: nextHistory, historyIndex: nextHistory.length - 1, scores });
  },
  undo: () => {
    const state = get();
    if (state.historyIndex === 0) return;
    const nextIndex = state.historyIndex - 1;
    set({ snapshot: cloneSnapshot(state.history[nextIndex]), historyIndex: nextIndex, aiThinking: false });
  },
  redo: () => {
    const state = get();
    if (state.historyIndex >= state.history.length - 1) return;
    const nextIndex = state.historyIndex + 1;
    set({ snapshot: cloneSnapshot(state.history[nextIndex]), historyIndex: nextIndex });
  },
  setMode: (mode) => {
    set({ mode });
  },
  toggleTheme: () => {
    const next = !get().darkMode;
    localStorage.setItem('utt-theme', next ? 'dark' : 'light');
    set({ darkMode: next });
  },
  toggleRules: () => set({ showRules: !get().showRules }),
  toggleSound: () => set({ soundEnabled: !get().soundEnabled }),
  toggleHint: () => set({ hintEnabled: !get().hintEnabled }),
}));

export const selectAvailableBoardIndices = (state: GameSnapshot) => getAllowedBoards(state);
export const selectAvailableCells = (state: GameSnapshot) => getAllowedCells(state);
export const selectBoardStatus = (state: GameSnapshot, boardIndex: number) => getBoardStatus(state, boardIndex);
export const selectGlobalStatus = (state: GameSnapshot) => getGlobalWinner(state.smallBoardWins);
