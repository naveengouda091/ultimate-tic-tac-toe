import { motion } from 'framer-motion';
import { useMultiplayerStore } from '../../store/multiplayerStore';

export function WaitingRoom() {
  const { room, playerRole, opponent, leaveRoom, showWaitingRoom } = useMultiplayerStore();

  if (!showWaitingRoom || !room) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-3xl border border-slate-700/50 bg-slate-950/90 p-8 text-center backdrop-blur-sm"
    >
      <div className="space-y-6">
        <div>
          <div className="text-2xl font-semibold text-slate-200">Waiting for Opponent</div>
          <div className="mt-2 text-slate-400">Share your room code to start playing</div>
        </div>

        {/* Player Status */}
        <div className="flex justify-center gap-6">
          <div className="space-y-2">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${
              playerRole === 'X'
                ? 'bg-cyan-500/20 border-2 border-cyan-400 text-cyan-400'
                : 'bg-slate-800 border-2 border-slate-600 text-slate-400'
            }`}>
              X
            </div>
            <div className="text-xs text-slate-400">You</div>
          </div>

          <div className="flex items-center">
            <div className="w-8 h-0.5 bg-slate-700"></div>
            <div className="mx-2 text-slate-600">VS</div>
            <div className="w-8 h-0.5 bg-slate-700"></div>
          </div>

          <div className="space-y-2">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${
              opponent
                ? 'bg-amber-500/20 border-2 border-amber-400 text-amber-400'
                : 'bg-slate-800 border-2 border-slate-600 text-slate-400'
            }`}>
              O
            </div>
            <div className="text-xs text-slate-400">
              {opponent ? 'Opponent' : 'Waiting...'}
            </div>
          </div>
        </div>

        {/* Loading Animation */}
        {!opponent && (
          <div className="flex justify-center">
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-cyan-400 rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="space-y-2 text-sm text-slate-500">
          <div>• Share your room code with a friend</div>
          <div>• Or wait for someone to join</div>
          <div>• The game will start automatically when both players are ready</div>
        </div>

        {/* Leave Room Button */}
        <button
          onClick={leaveRoom}
          className="rounded-2xl border border-red-500/50 bg-red-500/10 px-6 py-3 text-sm text-red-400 transition hover:bg-red-500/20 hover:border-red-400/70"
        >
          Leave Room
        </button>
      </div>
    </motion.div>
  );
}