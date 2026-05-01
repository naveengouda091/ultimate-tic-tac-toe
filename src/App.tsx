import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Board } from './components/Board';
import { Controls } from './components/Controls';
import { Confetti } from './components/Confetti';
import { Onboarding } from './components/Onboarding';
import { MultiplayerMenu } from './components/multiplayer/MultiplayerMenu';
import { RoomCodeDisplay } from './components/multiplayer/RoomCodeDisplay';
import { WaitingRoom } from './components/multiplayer/WaitingRoom';
import { GameStatus } from './components/multiplayer/GameStatus';
import { Leaderboard } from './components/multiplayer/Leaderboard';
import { useGameStore } from './store/gameStore';
import { useMultiplayerStore, initializeSocketListeners } from './store/multiplayerStore';
import { getAiMove, getAllowedCells, GameMode, Player } from './gameLogic';

type AppMode = 'local' | 'multiplayer';

const aiModes: GameMode[] = ['ai-easy', 'ai-medium', 'ai-hard', 'ai-ai'];

function isAiTurn(mode: GameMode, player: Player) {
  return mode === 'ai-ai' || (mode !== 'pvp' && player === 'O');
}

function playBeep(frequency: number, duration = 0.12) {
  if (typeof window === 'undefined' || !window.AudioContext) return;
  const context = new window.AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';
  gain.gain.value = 0.08;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
  oscillator.onended = () => context.close();
}

function App() {
  const [appMode, setAppMode] = useState<AppMode>('local');

  // Local game store
  const localStore = useGameStore();

  // Multiplayer store
  const multiplayerStore = useMultiplayerStore();

  // Initialize socket listeners on mount
  useEffect(() => {
    initializeSocketListeners();
  }, []);

  // Handle AI moves for local games
  useEffect(() => {
    if (appMode !== 'local') return;

    const { mode, snapshot, aiThinking, playMove, soundEnabled } = localStore;

    if (aiThinking || snapshot.globalWinner) return;

    const currentPlayer = snapshot.currentPlayer;
    if (!isAiTurn(mode, currentPlayer)) return;

    const aiMove = getAiMove(snapshot, mode, currentPlayer);
    if (!aiMove) return;

    const timeout = setTimeout(() => {
      playMove(aiMove.board, aiMove.cell);
      if (soundEnabled) playBeep(800);
    }, 500 + Math.random() * 500);

    return () => clearTimeout(timeout);
  }, [appMode, localStore.snapshot, localStore.aiThinking, localStore.mode]);

  const handleCellClick = (boardIndex: number, cellIndex: number) => {
    if (appMode === 'local') {
      const { snapshot, playMove, soundEnabled } = localStore;
      if (snapshot.globalWinner) return;

      const allowed = getAllowedCells(snapshot).some(move => move.board === boardIndex && move.cell === cellIndex);
      if (!allowed) return;

      playMove(boardIndex, cellIndex);
      if (soundEnabled) playBeep(600);
    } else {
      // Multiplayer move
      const { isMyTurn, makeMove } = multiplayerStore;
      if (!isMyTurn) return;

      makeMove(boardIndex, cellIndex);
    }
  };

  // Determine which game state to use
  const currentGameState = appMode === 'local' ? localStore.snapshot : multiplayerStore.gameState;
  const currentMode = appMode === 'local' ? localStore.mode : 'multiplayer';
  const showConfetti = appMode === 'local'
    ? localStore.snapshot.globalWinner && !localStore.snapshot.globalWinner.includes('T')
    : multiplayerStore.gameStatus === 'finished' && multiplayerStore.winner && !multiplayerStore.winner.includes('T');

  return (
    <div className={`min-h-screen transition-colors ${localStore.darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(251,191,36,0.1),transparent_70%)]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-amber-400 mb-4">
            Ultimate Tic-Tac-Toe
          </h1>

          {/* Mode Selector */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => setAppMode('local')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
                appMode === 'local'
                  ? 'bg-cyan-400 text-slate-950'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
              }`}
            >
              Local Game
            </button>
            <button
              onClick={() => setAppMode('multiplayer')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
                appMode === 'multiplayer'
                  ? 'bg-cyan-400 text-slate-950'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
              }`}
            >
              Multiplayer
            </button>
          </div>
        </header>

        {/* Game Content */}
        <AnimatePresence mode="wait">
          {appMode === 'local' ? (
            <motion.div
              key="local"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Local Game Board */}
              <section className="relative mx-auto w-full max-w-[860px] rounded-[40px] border border-slate-700/30 bg-slate-950/85 p-5 shadow-[0_0_120px_rgba(56,189,248,0.08)] backdrop-blur-xl">
                <div className="pointer-events-none absolute inset-0 rounded-[40px] border border-cyan-400/10" />
                <div className="relative">
                  <Board snapshot={localStore.snapshot} onCellClick={handleCellClick} />
                </div>
                <div className="mt-5 text-center text-sm uppercase tracking-[0.3em] text-slate-400">
                  {localStore.snapshot.activeBoard === null ? 'Play in any open board' : `Play in board ${localStore.snapshot.activeBoard + 1}`}
                </div>
              </section>

              {/* Local Game Controls */}
              <section className="relative mx-auto w-full max-w-[860px] rounded-[40px] border border-slate-700/30 bg-slate-950/85 p-6 shadow-[0_0_120px_rgba(56,189,248,0.08)] backdrop-blur-xl">
                <div className="pointer-events-none absolute inset-0 rounded-[40px] border border-cyan-400/10" />
                <div className="relative">
                  <Controls
                    mode={localStore.mode}
                    currentPlayer={localStore.snapshot.currentPlayer}
                    globalWinner={localStore.snapshot.globalWinner}
                    scores={localStore.scores}
                    activeBoard={localStore.snapshot.activeBoard}
                    onModeChange={localStore.setMode}
                    onNew={localStore.resetGame}
                    onUndo={localStore.undo}
                    onRedo={localStore.redo}
                    onToggleTheme={localStore.toggleTheme}
                    onToggleSound={localStore.toggleSound}
                    darkMode={localStore.darkMode}
                    soundEnabled={localStore.soundEnabled}
                    hintEnabled={localStore.hintEnabled}
                    onToggleHint={localStore.toggleHint}
                  />
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="multiplayer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Multiplayer Menu / Game */}
              {!multiplayerStore.roomCode ? (
                <div className="flex justify-center">
                  <MultiplayerMenu />
                </div>
              ) : (
                <>
                  {/* Game Status */}
                  <div className="text-center">
                    <GameStatus />
                  </div>

                  {/* Multiplayer Game Board */}
                  <section className="relative mx-auto w-full max-w-[860px] rounded-[40px] border border-slate-700/30 bg-slate-950/85 p-5 shadow-[0_0_120px_rgba(56,189,248,0.08)] backdrop-blur-xl">
                    <div className="pointer-events-none absolute inset-0 rounded-[40px] border border-cyan-400/10" />
                    <div className="relative">
                      <Board snapshot={currentGameState} onCellClick={handleCellClick} />
                    </div>
                    <div className="mt-5 text-center text-sm uppercase tracking-[0.3em] text-slate-400">
                      {currentGameState.activeBoard === null ? 'Play in any open board' : `Play in board ${currentGameState.activeBoard + 1}`}
                    </div>
                  </section>

                  {/* Room Code Display */}
                  <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                    <RoomCodeDisplay />
                    <Leaderboard />
                  </div>

                  {/* Waiting Room */}
                  <div className="flex justify-center">
                    <WaitingRoom />
                  </div>

                  {/* Restart Button for Finished Games */}
                  {multiplayerStore.gameStatus === 'finished' && (
                    <div className="flex justify-center">
                      <button
                        onClick={multiplayerStore.restartGame}
                        className="rounded-3xl bg-cyan-400 px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-950 transition hover:bg-cyan-300"
                      >
                        Play Again
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confetti */}
        <AnimatePresence>
          {showConfetti && <Confetti active={showConfetti} />}
        </AnimatePresence>

        {/* Onboarding */}
        <AnimatePresence>
          {localStore.showRules && (
            <Onboarding open={localStore.showRules} onClose={localStore.toggleRules} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
