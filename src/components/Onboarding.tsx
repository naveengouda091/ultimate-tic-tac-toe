import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingProps {
  open: boolean;
  onClose: () => void;
}

export function Onboarding({ open, onClose }: OnboardingProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="onboarding"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4"
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.94 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-2xl rounded-[36px] border border-slate-700/80 bg-slate-950/95 p-8 shadow-2xl backdrop-blur-xl"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Welcome</p>
                <h2 className="mt-3 text-3xl font-semibold text-slate-100">How to play Ultimate Tic-Tac-Toe</h2>
              </div>
              <button onClick={onClose} className="rounded-full bg-slate-800/80 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-700">
                Close
              </button>
            </div>
            <div className="grid gap-4 text-slate-300 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-900/80 p-5">
                <h3 className="text-lg font-semibold text-slate-100">Game flow</h3>
                <p className="mt-3 text-sm leading-6">Choose a cell in a small board. Your move sends the opponent to the board matching the cell position.</p>
              </div>
              <div className="rounded-3xl bg-slate-900/80 p-5">
                <h3 className="text-lg font-semibold text-slate-100">Win the boards</h3>
                <p className="mt-3 text-sm leading-6">Win three small boards in a row to claim the global board and win the match.</p>
              </div>
              <div className="rounded-3xl bg-slate-900/80 p-5">
                <h3 className="text-lg font-semibold text-slate-100">Forced moves</h3>
                <p className="mt-3 text-sm leading-6">If the redirected small board is already completed, the next player can move anywhere.</p>
              </div>
              <div className="rounded-3xl bg-slate-900/80 p-5">
                <h3 className="text-lg font-semibold text-slate-100">Tips</h3>
                <p className="mt-3 text-sm leading-6">Use the board glow to see allowed boards and the hint toggle for suggested moves.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
