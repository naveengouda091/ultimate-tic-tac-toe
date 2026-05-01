import { motion } from 'framer-motion';
import type { CellValue } from '../gameLogic';

interface CellProps {
  value: CellValue;
  active: boolean;
  lastMove: boolean;
  disabled: boolean;
  onClick: () => void;
}

const symbolStyles = {
  X: 'text-cyan-400',
  O: 'text-emerald-300',
};

export function Cell({ value, active, lastMove, disabled, onClick }: CellProps) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className={`relative grid aspect-square w-full place-items-center rounded-3xl border border-slate-800/60 bg-slate-950/85 text-3xl font-black tracking-wide transition-all ${
        active ? 'border-cyan-300/35 bg-slate-900/95 shadow-[0_0_24px_rgba(56,189,248,0.12)]' : 'border-slate-800/30 bg-slate-950/70'
      } ${disabled ? 'cursor-not-allowed opacity-65' : 'cursor-pointer hover:border-cyan-200/50'} ${lastMove ? 'ring-2 ring-cyan-400/60' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={`Cell ${value ?? 'empty'}`}
    >
      <motion.span
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: value ? 1 : 0.2, opacity: value ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 480, damping: 20, duration: 0.26 }}
        className={`${value ? symbolStyles[value] : 'text-transparent'} drop-shadow-[0_6px_14px_rgba(56,189,248,0.18)]`}
      >
        {value}
      </motion.span>
    </motion.button>
  );
}
