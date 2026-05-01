import { motion } from 'framer-motion';
import type { MoveSnapshot } from '../gameLogic';

interface MoveHistoryProps {
  history: MoveSnapshot[];
  lastMove: MoveSnapshot | null;
}

export function MoveHistory({ history, lastMove }: MoveHistoryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass-card rounded-[32px] border border-slate-800/70 bg-slate-950/70 p-5 shadow-2xl backdrop-blur-xl"
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-slate-500">
        <span>Move history</span>
        <span className="text-slate-400">{history.length - 1} moves</span>
      </div>
      <div className="mt-4 space-y-3 text-sm text-slate-200">
        {history.slice(1).reverse().slice(0, 6).map((move, index) => (
          <div key={`${move.boardIndex}-${move.cellIndex}-${index}`} className="rounded-3xl bg-slate-900/80 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-slate-100">{move.player} placed at board {move.boardIndex + 1}, cell {move.cellIndex + 1}</p>
              {lastMove && lastMove.boardIndex === move.boardIndex && lastMove.cellIndex === move.cellIndex ? (
                <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-xs text-cyan-200">Latest</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
