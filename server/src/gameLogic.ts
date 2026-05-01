export type Player = 'X' | 'O';
export type CellValue = Player | null;
export type SmallBoardResult = Player | 'T' | null;

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

export const cloneSnapshot = (state: GameSnapshot): GameSnapshot => ({
  smallBoards: state.smallBoards.map((board) => [...board]),
  smallBoardWins: [...state.smallBoardWins],
  activeBoard: state.activeBoard,
  currentPlayer: state.currentPlayer,
  globalWinner: state.globalWinner,
  lastMove: state.lastMove ? { ...state.lastMove } : null,
});