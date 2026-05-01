import { motion } from 'framer-motion';
import { useMultiplayerStore } from '../../store/multiplayerStore';

export function RoomCodeDisplay() {
  const { roomCode, room, playerRole, gameStatus, showRoomCode, setShowRoomCode, giveUp, playerPoints } = useMultiplayerStore();

  if (!roomCode || !showRoomCode) return null;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy room code');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-3xl border border-slate-700/50 bg-slate-950/90 p-6 text-center backdrop-blur-sm"
    >
      <div className="space-y-4">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Room Code</div>
          <div className="mt-2 text-3xl font-mono font-bold tracking-widest text-cyan-400">
            {roomCode}
          </div>
        </div>

        <button
          onClick={copyToClipboard}
          className="rounded-2xl bg-slate-800 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-700 hover:text-slate-200"
        >
          Copy Code
        </button>

        <div className="text-xs text-slate-500">
          Share this code with friends to let them join
        </div>

        {room && (
          <div className="space-y-2 pt-4 border-t border-slate-800/50">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Players</div>
            <div className="flex justify-center gap-4 text-sm">
              <div className={`px-3 py-1 rounded-full ${
                playerRole === 'X' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'
              }`}>
                You ({playerRole})
              </div>
              <div className={`px-3 py-1 rounded-full ${
                room.players.length > 1 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
              }`}>
                {room.players.length > 1 ? 'Opponent' : 'Waiting...'}
              </div>
            </div>
            <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Your Points</div>
            <div className="text-sm font-semibold text-slate-200">{playerPoints !== null ? playerPoints : '0'}</div>
          </div>
        )}

        {gameStatus === 'playing' && room && room.players.length > 1 && (
          <div className="pt-4 border-t border-slate-800/50">
            <button
              onClick={giveUp}
              className="w-full rounded-2xl bg-red-500 px-4 py-2 text-sm text-slate-950 transition hover:bg-red-400"
            >
              Give Up
            </button>
          </div>
        )}

        {gameStatus === 'playing' && (
          <div className="pt-4 border-t border-slate-800/50">
            <button
              onClick={() => setShowRoomCode(false)}
              className="rounded-2xl bg-slate-800 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-700 hover:text-slate-200"
            >
              Hide Room Info
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}