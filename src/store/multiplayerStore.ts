import { create } from 'zustand';
import { GameSnapshot, createEmptySnapshot } from '../gameLogic';
import { gameSocket } from '../services/socketService';

const GAME_SERVER_URL = (import.meta as any).env?.VITE_GAME_SERVER_URL || 'http://localhost:3001';

export type GameMode = 'local' | 'multiplayer';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';
export type PlayerRole = 'X' | 'O' | 'spectator' | null;

interface LeaderboardEntry {
  name: string;
  points: number;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
}

interface MultiplayerState {
  // Connection
  connectionStatus: ConnectionStatus;
  playerId: string | null;
  playerRole: PlayerRole;
  roomCode: string | null;
  playerName: string;

  // Game state
  gameState: GameSnapshot;
  isMyTurn: boolean;
  gameStatus: 'waiting' | 'playing' | 'finished';
  winner: string | null;

  // Room info
  room: any | null;
  opponent: any | null;
  spectators: any[];
  leaderboard: LeaderboardEntry[];
  playerPoints: number | null;

  // Queue state
  isInQueue: boolean;

  // UI state
  showRoomCode: boolean;
  showJoinRoom: boolean;
  showWaitingRoom: boolean;
  error: string | null;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;

  createRoom: (playerName?: string) => void;
  joinRoom: (roomCode: string, playerName?: string) => void;
  leaveRoom: () => void;

  makeMove: (boardIndex: number, cellIndex: number) => void;
  restartGame: () => void;
  giveUp: () => void;

  spectateRoom: (roomCode: string, spectatorName?: string) => void;
  stopSpectating: () => void;

  fetchLeaderboard: () => Promise<void>;

  joinQueue: () => void;
  leaveQueue: () => void;

  setPlayerName: (name: string) => void;
  setShowRoomCode: (show: boolean) => void;
  setShowJoinRoom: (show: boolean) => void;
  clearError: () => void;
}

export const useMultiplayerStore = create<MultiplayerState>((set, get) => ({
  // Initial state
  connectionStatus: 'disconnected',
  playerId: null,
  playerRole: null,
  roomCode: null,
  playerName: localStorage.getItem('playerName') || 'Player',

  gameState: createEmptySnapshot(),
  isMyTurn: false,
  gameStatus: 'waiting',
  winner: null,

  room: null,
  opponent: null,
  spectators: [],
  leaderboard: [],
  playerPoints: null,

  isInQueue: false,

  showRoomCode: false,
  showJoinRoom: false,
  showWaitingRoom: false,
  error: null,

  // Connection actions
  connect: async () => {
    try {
      set({ connectionStatus: 'connecting', error: null });
      await gameSocket.connect();
      set({ connectionStatus: 'connected' });
      get().fetchLeaderboard();
    } catch (error) {
      set({
        connectionStatus: 'disconnected',
        error: 'Failed to connect to game server'
      });
    }
  },

  disconnect: () => {
    gameSocket.disconnect();
    set({
      connectionStatus: 'disconnected',
      playerId: null,
      playerRole: null,
      roomCode: null,
      gameState: createEmptySnapshot(),
      isMyTurn: false,
      gameStatus: 'waiting',
      winner: null,
      room: null,
      opponent: null,
      spectators: [],
      leaderboard: [],
      playerPoints: null,
      showRoomCode: false,
      showJoinRoom: false,
      showWaitingRoom: false,
    });
  },

  // Room actions
  createRoom: (playerName) => {
    if (get().connectionStatus !== 'connected') return;
    gameSocket.createRoom(playerName);
  },

  joinRoom: (roomCode, playerName) => {
    if (get().connectionStatus !== 'connected') return;
    gameSocket.joinRoom(roomCode, playerName);
  },

  leaveRoom: () => {
    gameSocket.leaveRoom();
  },

  // Game actions
  makeMove: (boardIndex, cellIndex) => {
    if (!get().isMyTurn) return;
    gameSocket.makeMove(boardIndex, cellIndex);
  },

  restartGame: () => {
    gameSocket.restartGame();
  },

  giveUp: () => {
    gameSocket.giveUp();
  },

  // Spectating
  spectateRoom: (roomCode, spectatorName) => {
    if (get().connectionStatus !== 'connected') return;
    gameSocket.spectateRoom(roomCode, spectatorName);
  },

  stopSpectating: () => {
    gameSocket.stopSpectating();
  },

  fetchLeaderboard: async () => {
    try {
      const response = await fetch(`${GAME_SERVER_URL}/leaderboard`);
      if (!response.ok) {
        throw new Error('Failed to load leaderboard');
      }
      const leaderboard = await response.json();
      const currentPlayerName = get().playerName;
      const playerPoints = leaderboard.find((entry: any) => entry.name === currentPlayerName)?.points ?? null;
      set({ leaderboard, playerPoints });
    } catch (error) {
      console.error('Leaderboard fetch failed:', error);
    }
  },

  // Queue actions
  joinQueue: () => {
    if (get().connectionStatus !== 'connected') {
      get().connect().then(() => gameSocket.joinQueue(get().playerName));
    } else {
      gameSocket.joinQueue(get().playerName);
    }
  },

  leaveQueue: () => {
    gameSocket.leaveQueue();
  },

  // UI actions
  setPlayerName: (name) => {
    localStorage.setItem('playerName', name);
    const state = get();
    const playerPoints = state.leaderboard.find((entry) => entry.name === name)?.points ?? null;
    set({ playerName: name, playerPoints });
  },

  setShowRoomCode: (show) => set({ showRoomCode: show }),
  setShowJoinRoom: (show) => set({ showJoinRoom: show }),
  clearError: () => set({ error: null }),
}));

// Socket event handlers
export const initializeSocketListeners = () => {
  const store = useMultiplayerStore.getState();

  // Room events
  gameSocket.onRoomCreated((data) => {
    useMultiplayerStore.setState({
      roomCode: data.roomCode,
      room: data.room,
      playerRole: 'X',
      showRoomCode: true,
      showWaitingRoom: true,
      error: null,
    });
  });

  gameSocket.onRoomJoined((data) => {
    const opponent = data.room.players.find((p: any) => p.symbol !== data.playerSymbol);
    useMultiplayerStore.setState({
      room: data.room,
      roomCode: data.room.code,
      playerRole: data.playerSymbol,
      opponent,
      gameStatus: data.room.status,
      isMyTurn: data.room.status === 'playing' && data.room.gameState.currentPlayer === data.playerSymbol,
      showJoinRoom: false,
      showWaitingRoom: data.room.status === 'waiting',
      error: null,
    });
  });

  gameSocket.onRoomJoinError((error) => {
    useMultiplayerStore.setState({
      error,
      showJoinRoom: true,
    });
  });

  // Game events
  gameSocket.onGameUpdate((gameState) => {
    const state = useMultiplayerStore.getState();
    useMultiplayerStore.setState({
      gameState,
      isMyTurn: state.playerRole === gameState.currentPlayer,
    });
  });

  gameSocket.onGameStarted((room) => {
    const state = useMultiplayerStore.getState();
    useMultiplayerStore.setState({
      room,
      gameStatus: 'playing',
      isMyTurn: state.playerRole === room.gameState.currentPlayer,
      showWaitingRoom: false,
    });
  });

  gameSocket.onGameFinished((data) => {
    useMultiplayerStore.setState({
      gameStatus: 'finished',
      winner: data.winner,
      room: data.room,
    });
  });

  // Player events
  gameSocket.onPlayerJoined((data) => {
    const opponent = data.room.players.find((p: any) => p.id !== useMultiplayerStore.getState().playerId);
    useMultiplayerStore.setState({
      room: data.room,
      opponent,
    });
  });

  gameSocket.onPlayerLeft((data) => {
    useMultiplayerStore.setState({
      room: data.room,
      opponent: null,
      gameStatus: 'waiting',
      showWaitingRoom: true,
    });
  });

  gameSocket.onLeaderboardUpdated((leaderboard) => {
    const state = useMultiplayerStore.getState();
    const playerPoints = leaderboard.find((entry) => entry.name === state.playerName)?.points ?? null;
    useMultiplayerStore.setState({ leaderboard, playerPoints });
  });

  // Queue events
  gameSocket.onQueueJoined(() => {
    useMultiplayerStore.setState({ isInQueue: true, error: null });
  });

  gameSocket.onQueueLeft(() => {
    useMultiplayerStore.setState({ isInQueue: false });
  });

  gameSocket.onMatchFound((data) => {
    const opponent = data.room.players.find((p: any) => p.id !== useMultiplayerStore.getState().playerId);
    useMultiplayerStore.setState({
      isInQueue: false,
      roomCode: data.roomCode,
      room: data.room,
      playerRole: data.playerSymbol,
      opponent,
      gameState: data.room.gameState,
      gameStatus: 'playing',
      isMyTurn: data.playerSymbol === data.room.gameState.currentPlayer,
      showWaitingRoom: false,
    });
  });

  // Spectator events
  gameSocket.onSpectatorJoined((spectator) => {
    const state = useMultiplayerStore.getState();
    useMultiplayerStore.setState({
      spectators: [...state.spectators, spectator],
    });
  });

  gameSocket.onSpectatorLeft((spectatorId) => {
    const state = useMultiplayerStore.getState();
    useMultiplayerStore.setState({
      spectators: state.spectators.filter(s => s.id !== spectatorId),
    });
  });

  // Error handling
  gameSocket.onRoomError((error) => {
    useMultiplayerStore.setState({ error });
  });
};