import { motion } from 'framer-motion';
import { useMultiplayerStore } from '../../store/multiplayerStore';

export function Leaderboard() {
  const { leaderboard, playerPoints, playerName } = useMultiplayerStore();

  if (!leaderboard.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-slate-700/50 bg-slate-950/90 p-6 text-center backdrop-blur-sm"
      >
        <div className="text-lg font-semibold text-slate-100">Leaderboard</div>
        <div className="mt-3 text-sm text-slate-400">No leaderboard data available yet.</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-slate-700/50 bg-slate-950/90 p-6 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-slate-100">Leaderboard</div>
          <div className="mt-1 text-sm text-slate-400">Top players by points</div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Your points</div>
          <div className="text-2xl font-bold text-cyan-300">{playerPoints !== null ? playerPoints : 0}</div>
          <div className="text-xs text-slate-500">{playerName}</div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {leaderboard.slice(0, 8).map((entry, index) => (
          <div key={entry.name} className="flex items-center justify-between rounded-3xl border border-slate-800/80 bg-slate-900/80 px-4 py-3 text-sm text-slate-200">
            <div className="flex items-center gap-3">
              <div className="text-cyan-300 font-semibold">#{index + 1}</div>
              <div>
                <div className="font-semibold">{entry.name}</div>
                <div className="text-xs text-slate-500">{entry.wins}W • {entry.losses}L • {entry.draws}D</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-cyan-200">{entry.points}</div>
              <div className="text-xs text-slate-500">{entry.gamesPlayed} games</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
