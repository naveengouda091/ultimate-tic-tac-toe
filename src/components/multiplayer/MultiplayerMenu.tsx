import { motion } from 'framer-motion';
import { useState } from 'react';
import { useMultiplayerStore } from '../../store/multiplayerStore';

export function MultiplayerMenu() {
  const {
    connectionStatus,
    connect,
    createRoom,
    joinRoom,
    playerName,
    setPlayerName,
    showJoinRoom,
    setShowJoinRoom,
    error,
    clearError,
    joinQueue,
    leaveQueue,
    isInQueue,
  } = useMultiplayerStore();

  const [joinCode, setJoinCode] = useState('');

  const handleCreateRoom = () => {
    if (isInQueue) leaveQueue();
    if (connectionStatus !== 'connected') {
      connect().then(() => createRoom(playerName));
    } else {
      createRoom(playerName);
    }
  };

  const handleJoinRoom = () => {
    if (isInQueue) leaveQueue();
    if (connectionStatus !== 'connected') {
      connect().then(() => joinRoom(joinCode.toUpperCase(), playerName));
    } else {
      joinRoom(joinCode.toUpperCase(), playerName);
    }
  };

  const handleQuickMatch = () => {
    if (connectionStatus !== 'connected') {
      connect().then(() => joinQueue());
    } else {
      joinQueue();
    }
  };

  const handleCancelQueue = () => {
    leaveQueue();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="flex flex-col items-center gap-6"
    >
      {/* Player Name Input */}
      <div className="w-full max-w-sm">
        <label className="block text-sm uppercase tracking-[0.2em] text-slate-400 mb-2">
          Your Name
        </label>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="w-full rounded-2xl border border-slate-700/60 bg-slate-950/80 px-4 py-3 text-slate-200 outline-none transition focus:border-cyan-300/60"
          placeholder="Enter your name"
          maxLength={20}
        />
      </div>

      {/* Connection Status */}
      <div className="text-center">
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
          connectionStatus === 'connected'
            ? 'bg-green-500/10 text-green-400'
            : connectionStatus === 'connecting'
            ? 'bg-yellow-500/10 text-yellow-400'
            : 'bg-red-500/10 text-red-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected'
              ? 'bg-green-400'
              : connectionStatus === 'connecting'
              ? 'bg-yellow-400 animate-pulse'
              : 'bg-red-400'
          }`} />
          {connectionStatus === 'connected'
            ? 'Connected'
            : connectionStatus === 'connecting'
            ? 'Connecting...'
            : 'Disconnected'}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm rounded-2xl border border-red-500/50 bg-red-500/10 p-4 text-center text-red-400"
        >
          {error}
          <button
            onClick={clearError}
            className="ml-2 text-red-300 hover:text-red-200"
          >
            ✕
          </button>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button
          onClick={handleQuickMatch}
          disabled={connectionStatus === 'connecting' || isInQueue}
          className="w-full rounded-3xl bg-green-500 px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-950 transition hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isInQueue ? 'Finding Match...' : 'Quick Match'}
        </button>

        <button
          onClick={handleCreateRoom}
          disabled={connectionStatus === 'connecting' || isInQueue}
          className="w-full rounded-3xl bg-cyan-400 px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {connectionStatus === 'connecting' ? 'Connecting...' : 'Create Room'}
        </button>

        <button
          onClick={() => setShowJoinRoom(!showJoinRoom)}
          disabled={isInQueue}
          className="w-full rounded-3xl border border-slate-700/60 bg-slate-950/80 px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-300/40 hover:bg-slate-900/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Join Room
        </button>

        {isInQueue && (
          <button
            onClick={handleCancelQueue}
            className="w-full rounded-3xl border border-red-500/60 bg-red-500/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-red-400 transition hover:bg-red-500/20"
          >
            Cancel Search
          </button>
        )}
      </div>

      {/* Join Room Form */}
      {showJoinRoom && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="w-full max-w-sm space-y-3"
        >
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            className="w-full rounded-2xl border border-slate-700/60 bg-slate-950/80 px-4 py-3 text-center text-2xl font-mono uppercase tracking-widest text-slate-200 outline-none transition focus:border-cyan-300/60"
            placeholder="ABC123"
            maxLength={6}
          />
          <button
            onClick={handleJoinRoom}
            disabled={!joinCode || joinCode.length !== 6 || connectionStatus === 'connecting'}
            className="w-full rounded-3xl bg-amber-400 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-950 transition hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Join Game
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}