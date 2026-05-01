import { motion } from 'framer-motion';
import type { GameMode } from '../gameLogic';

interface ControlsProps {
  mode: GameMode;
  currentPlayer: string;
  globalWinner: string | null;
  scores: { X: number; O: number; draws: number };
  activeBoard: number | null;
  onModeChange: (mode: GameMode) => void;
  onNew: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleTheme: () => void;
  onToggleSound: () => void;
  darkMode: boolean;
  soundEnabled: boolean;
  hintEnabled: boolean;
  onToggleHint: () => void;
}

const modeLabels: Record<GameMode, string> = {
  'pvp': 'Player vs Player',
  'ai-easy': 'AI Easy',
  'ai-medium': 'AI Medium',
  'ai-hard': 'AI Hard',
  'ai-ai': 'AI vs AI',
};

export function Controls({
  mode,
  currentPlayer,
  globalWinner,
  scores,
  activeBoard,
  onModeChange,
  onNew,
  onUndo,
  onRedo,
  onToggleTheme,
  onToggleSound,
  darkMode,
  soundEnabled,
  hintEnabled,
  onToggleHint,
}: ControlsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="flex flex-col items-center gap-4"
    >
      <div className="flex items-center gap-3">
        <label className="text-sm uppercase tracking-[0.2em] text-slate-400">Mode:</label>
        <select
          value={mode}
          onChange={(event) => onModeChange(event.target.value as GameMode)}
          className="rounded-2xl border border-slate-700/60 bg-slate-950/80 px-4 py-2 text-sm text-slate-200 outline-none transition hover:border-cyan-300/40 focus:border-cyan-300/60"
        >
          {Object.entries(modeLabels).map(([value, label]) => (
            <option key={value} value={value} className="bg-slate-900 text-slate-100">
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onUndo}
          className="rounded-3xl border border-slate-700/60 bg-slate-950/80 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-300/40 hover:bg-slate-900/90 hover:text-cyan-200"
        >
          Undo
        </button>
        <button
          onClick={onNew}
          className="rounded-3xl bg-cyan-400 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-950 transition hover:bg-cyan-300"
        >
          Reset Game
        </button>
      </div>
    </motion.div>
  );
}
