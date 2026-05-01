import { motion } from 'framer-motion';
import { useMultiplayerStore } from '../../store/multiplayerStore';

export function GameStatus() {
  const { gameStatus, isMyTurn, playerRole, winner, gameState, opponent } = useMultiplayerStore();

  if (gameStatus === 'waiting') return null;

  const getStatusText = () => {
    if (gameStatus === 'finished') {
      if (winner === 'T') return 'Game Draw!';
      if (winner === playerRole) return 'You Win!';
      return 'You Lose!';
    }

    if (isMyTurn) {
      return 'Your Turn';
    }

    return opponent ? "Opponent's Turn" : 'Waiting...';
  };

  const getStatusColor = () => {
    if (gameStatus === 'finished') {
      if (winner === 'T') return 'text-slate-400';
      if (winner === playerRole) return 'text-green-400';
      return 'text-red-400';
    }

    return isMyTurn ? 'text-cyan-400' : 'text-amber-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
    >
      <div className={`text-xl font-semibold ${getStatusColor()}`}>
        {getStatusText()}
      </div>

      {gameStatus === 'playing' && gameState.activeBoard !== null && (
        <div className="mt-2 text-sm text-slate-400">
          Play in board {gameState.activeBoard + 1}
        </div>
      )}

      {gameStatus === 'finished' && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4"
        >
          <div className="text-4xl font-black text-slate-200">
            {winner === 'T' ? 'DRAW' : `${winner} WINS!`}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}