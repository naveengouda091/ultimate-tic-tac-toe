export type Player = 'X' | 'O';
export type CellValue = Player | null;
export type SmallBoardResult = Player | 'T' | null;
export type GameMode = 'pvp' | 'ai-easy' | 'ai-medium' | 'ai-hard' | 'ai-ai';

export interface MoveSnapshot {
  boardIndex: number;
  cellIndex: number;
  player: Player;
}

export interface GameSnapshot {
  smallBoards: CellValue[][];
  smallBoardWins: SmallBoardResult[];
  activeBoard: number | null;
  currentPlayer: Player;
  globalWinner: SmallBoardResult;
  lastMove: MoveSnapshot | null;
}

const winLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export const createEmptySnapshot = (): GameSnapshot => ({
  smallBoards: Array.from({ length: 9 }, () => Array(9).fill(null) as CellValue[]),
  smallBoardWins: Array(9).fill(null) as SmallBoardResult[],
  activeBoard: null,
  currentPlayer: 'X',
  globalWinner: null,
  lastMove: null,
});

export const getWinner = (cells: CellValue[]): Player | null => {
  for (const [a, b, c] of winLines) {
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
      return cells[a];
    }
  }
  return null;
};

export const isFull = (cells: CellValue[]): boolean => cells.every(Boolean);

export const getSmallBoardResult = (cells: CellValue[]): SmallBoardResult => {
  const winner = getWinner(cells);
  if (winner) return winner;
  return isFull(cells) ? 'T' : null;
};

export const getGlobalWinner = (smallBoardWins: SmallBoardResult[]): SmallBoardResult => {
  const mapped = smallBoardWins.map((value) => (value === 'T' ? null : value));
  return getWinner(mapped as CellValue[]) as SmallBoardResult;
};

export const getNextActiveBoard = (cellIndex: number, nextBoardState: SmallBoardResult): number | null => {
  if (nextBoardState === null) return cellIndex;
  return null;
};

export const getAllowedBoards = (state: GameSnapshot): number[] => {
  if (state.globalWinner) return [];
  if (state.activeBoard === null) {
    return state.smallBoardWins
      .map((result, index) => ({ result, index }))
      .filter((board) => board.result === null)
      .map((board) => board.index);
  }
  return state.smallBoardWins[state.activeBoard] === null ? [state.activeBoard] : getAllowedBoards({ ...state, activeBoard: null });
};

export const getAllowedCells = (state: GameSnapshot): { board: number; cell: number }[] => {
  const allowedBoards = getAllowedBoards(state);
  return allowedBoards.flatMap((boardIndex) =>
    state.smallBoards[boardIndex].map((value, cellIndex) => (value === null ? { board: boardIndex, cell: cellIndex } : null)).filter(Boolean) as { board: number; cell: number }[],
  );
};

export const applyMove = (state: GameSnapshot, boardIndex: number, cellIndex: number): GameSnapshot => {
  if (state.globalWinner) return state;
  const allowed = getAllowedCells(state).some((move) => move.board === boardIndex && move.cell === cellIndex);
  if (!allowed) return state;

  const newBoards = state.smallBoards.map((board, idx) => (idx === boardIndex ? [...board] : [...board]));
  newBoards[boardIndex][cellIndex] = state.currentPlayer;

  const nextSmallWins = [...state.smallBoardWins];
  if (!nextSmallWins[boardIndex]) {
    nextSmallWins[boardIndex] = getSmallBoardResult(newBoards[boardIndex]);
  }

  const nextActive = getNextActiveBoard(cellIndex, nextSmallWins[cellIndex]);
  const nextGlobal = getGlobalWinner(nextSmallWins);

  return {
    smallBoards: newBoards,
    smallBoardWins: nextSmallWins,
    activeBoard: nextActive,
    currentPlayer: state.currentPlayer === 'X' ? 'O' : 'X',
    globalWinner: nextGlobal,
    lastMove: { boardIndex, cellIndex, player: state.currentPlayer },
  };
};

export const boardIsComplete = (state: GameSnapshot, boardIndex: number): boolean => {
  return state.smallBoardWins[boardIndex] !== null;
};

export const getBoardStatus = (state: GameSnapshot, boardIndex: number) => {
  if (state.smallBoardWins[boardIndex] === 'T') return 'draw';
  if (state.smallBoardWins[boardIndex]) return 'won';
  return 'open';
};

export const getValidMoveHint = (state: GameSnapshot): { board: number; cell: number } | null => {
  const allowed = getAllowedCells(state);
  return allowed.length ? allowed[0] : null;
};

export const cloneSnapshot = (state: GameSnapshot): GameSnapshot => ({
  smallBoards: state.smallBoards.map((board) => [...board]),
  smallBoardWins: [...state.smallBoardWins],
  activeBoard: state.activeBoard,
  currentPlayer: state.currentPlayer,
  globalWinner: state.globalWinner,
  lastMove: state.lastMove ? { ...state.lastMove } : null,
});

const scoreSmallResult = (result: SmallBoardResult, player: Player): number => {
  if (result === player) return 10;
  if (result && result !== 'T') return -10;
  return 0;
};

const evaluateState = (state: GameSnapshot, player: Player): number => {
  if (state.globalWinner === player) return 1000;
  if (state.globalWinner && state.globalWinner !== 'T') return -1000;
  return state.smallBoardWins.reduce((sum, result) => sum + scoreSmallResult(result, player), 0);
};

const swapPlayer = (player: Player): Player => (player === 'X' ? 'O' : 'X');

const getRandomItem = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

export const getRandomMove = (state: GameSnapshot) => {
  const moves = getAllowedCells(state);
  return moves.length ? getRandomItem(moves) : null;
};

const canWinNext = (state: GameSnapshot, player: Player): { board: number; cell: number } | null => {
  const moves = getAllowedCells(state);
  for (const move of moves) {
    const next = applyMove(state, move.board, move.cell);
    if (next.smallBoardWins[move.board] === player || next.globalWinner === player) {
      return move;
    }
  }
  return null;
};

export const getMediumAiMove = (state: GameSnapshot, player: Player) => {
  const winMove = canWinNext(state, player);
  if (winMove) return winMove;
  const blockMove = canWinNext(state, swapPlayer(player));
  if (blockMove) return blockMove;
  return getRandomMove(state);
};

const minimax = (state: GameSnapshot, player: Player, maximizing: boolean, depth: number, alpha: number, beta: number, rootPlayer: Player): number => {
  if (state.globalWinner || depth === 0) return evaluateState(state, rootPlayer);
  const moves = getAllowedCells(state);
  if (!moves.length) return evaluateState(state, rootPlayer);

  if (maximizing) {
    let maxScore = -Infinity;
    for (const move of moves) {
      const next = applyMove(state, move.board, move.cell);
      const score = minimax(next, swapPlayer(player), false, depth - 1, alpha, beta, rootPlayer);
      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return maxScore;
  }

  let minScore = Infinity;
  for (const move of moves) {
    const next = applyMove(state, move.board, move.cell);
    const score = minimax(next, swapPlayer(player), true, depth - 1, alpha, beta, rootPlayer);
    minScore = Math.min(minScore, score);
    beta = Math.min(beta, score);
    if (beta <= alpha) break;
  }
  return minScore;
};

export const getHardAiMove = (state: GameSnapshot, player: Player) => {
  const moves = getAllowedCells(state);
  if (!moves.length) return null;
  let bestMove = moves[0];
  let bestScore = -Infinity;
  for (const move of moves) {
    const next = applyMove(state, move.board, move.cell);
    const score = minimax(next, swapPlayer(player), false, 4, -Infinity, Infinity, player);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
};

export const getAiMove = (state: GameSnapshot, mode: GameMode, player: Player) => {
  if (mode === 'ai-easy') return getRandomMove(state);
  if (mode === 'ai-medium') return getMediumAiMove(state, player) || getRandomMove(state);
  if (mode === 'ai-hard') return getHardAiMove(state, player) || getRandomMove(state);
  return null;
};
