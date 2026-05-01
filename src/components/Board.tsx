import type { GameSnapshot } from '../gameLogic';
import { SmallBoard } from './SmallBoard';

interface BoardProps {
  snapshot: GameSnapshot;
  onCellClick: (boardIndex: number, cellIndex: number) => void;
}

export function Board({ snapshot, onCellClick }: BoardProps) {
  const activeBoard = snapshot.activeBoard;

  return (
    <div className="grid w-full grid-cols-3 gap-3 p-1 sm:gap-4 sm:p-2">
      {snapshot.smallBoards.map((board, index) => {
        const active = activeBoard === null ? snapshot.smallBoardWins[index] === null : activeBoard === index;
        return (
          <SmallBoard
            key={index}
            boardIndex={index}
            cells={board}
            winner={snapshot.smallBoardWins[index]}
            active={active}
            forced={activeBoard !== null && activeBoard === index}
            lastMove={snapshot.lastMove}
            onCellClick={onCellClick}
          />
        );
      })}
    </div>
  );
}
