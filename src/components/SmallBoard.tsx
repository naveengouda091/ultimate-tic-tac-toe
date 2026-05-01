import { motion } from 'framer-motion';
import type { CellValue, SmallBoardResult } from '../gameLogic';
import { Cell } from './Cell';

interface SmallBoardProps {
  boardIndex: number;
  cells: CellValue[];
  winner: SmallBoardResult;
  active: boolean;
  forced: boolean;
  lastMove: { boardIndex: number; cellIndex: number } | null;
  onCellClick: (boardIndex: number, cellIndex: number) => void;
}

export function SmallBoard({ boardIndex, cells, winner, active, forced, lastMove, onCellClick }: SmallBoardProps) {
  const displayWinner = winner === 'T' ? 'DRAW' : winner;

  return (
    <motion.div
      layout
      initial={{ opacity: 0.9, scale: 0.98 }}
      animate={{ opacity: 1, scale: active ? 1.01 : 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className={`relative aspect-square overflow-hidden rounded-[28px] border border-slate-700/50 bg-slate-950/95 p-3 shadow-[0_0_40px_rgba(56,189,248,0.08)] transition-all ${
        active ? 'border-cyan-300/40 shadow-[0_0_60px_rgba(56,189,248,0.18)]' : ''
      } ${forced ? 'ring-2 ring-amber-300/20' : ''} ${winner ? 'opacity-90' : 'opacity-100'}`}
    >
      <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-3">
        {cells.map((value, index) => (
          <Cell
            key={index}
            value={value}
            active={!winner && active}
            disabled={Boolean(winner) || !active}
            lastMove={Boolean(lastMove && lastMove.boardIndex === boardIndex && lastMove.cellIndex === index)}
            onClick={() => onCellClick(boardIndex, index)}
          />
        ))}
      </div>

      {winner && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 grid place-items-center rounded-[28px] bg-slate-950/92 text-center text-sm uppercase tracking-[0.18em] text-slate-200"
        >
          <div className="space-y-3 px-3">
            <div className="text-xs text-slate-500">Claimed</div>
            <div className="text-4xl font-black tracking-[0.24em] text-cyan-200 opacity-90">{displayWinner}</div>
            <div className="rounded-3xl bg-slate-900/80 px-3 py-2 text-xs uppercase tracking-[0.3em] text-slate-400">
              {displayWinner === 'DRAW' ? 'Drawn board' : `${displayWinner} controls this board`}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
