const SERVER_URL = (import.meta as any).env?.VITE_GAME_SERVER_URL || 'http://localhost:3001';

import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { GameSnapshot } from '../gameLogic';

interface ServerToClientEvents {
  room_created: (data: { roomCode: string; room: any }) => void;
  room_joined: (data: { room: any; playerSymbol: 'X' | 'O' }) => void;
  room_join_error: (error: string) => void;
  game_update: (gameState: GameSnapshot) => void;
  player_joined: (data: { player: any; room: any }) => void;
  player_left: (data: { playerId: string; room: any }) => void;
  game_started: (room: any) => void;
  game_finished: (data: { winner: string | null; room: any }) => void;
  leaderboard_updated: (leaderboard: Array<{ name: string; points: number; wins: number; losses: number; draws: number; gamesPlayed: number }>) => void;
  spectator_joined: (spectator: any) => void;
  spectator_left: (spectatorId: string) => void;
  room_error: (error: string) => void;
  queue_joined: () => void;
  queue_left: () => void;
  match_found: (data: { roomCode: string; room: any; playerSymbol: 'X' | 'O' }) => void;
}

interface ClientToServerEvents {
  create_room: (playerName?: string) => void;
  join_room: (data: { roomCode: string; playerName?: string }) => void;
  leave_room: () => void;
  give_up: () => void;
  make_move: (data: { boardIndex: number; cellIndex: number }) => void;
  restart_game: () => void;
  spectate_room: (data: { roomCode: string; spectatorName?: string }) => void;
  stop_spectating: () => void;
  join_queue: (playerName?: string) => void;
  leave_queue: () => void;
}

class GameSocketService {
  private socket: any = null;
  private eventListeners: Record<string, Array<(...args: any[]) => void>> = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  private registerEventListener(event: string, callback: (...args: any[]) => void): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }

    this.eventListeners[event].push(callback);
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  private attachRegisteredListeners(): void {
    if (!this.socket) return;
    Object.entries(this.eventListeners).forEach(([event, callbacks]) => {
      callbacks.forEach((callback) => {
        this.socket.on(event, callback);
      });
    });
  }

  connect(serverUrl: string = SERVER_URL): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
      });

      this.attachRegisteredListeners();

      this.socket.on('connect', () => {
        console.log('Connected to game server');
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('connect_error', (error: any) => {
        console.error('Connection error:', error);
        this.reconnectAttempts++;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(new Error('Failed to connect to game server'));
        }
      });

      this.socket.on('disconnect', (reason: any) => {
        console.log('Disconnected from game server:', reason);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Room management
  createRoom(playerName?: string): void {
    this.socket?.emit('create_room', playerName);
  }

  joinRoom(roomCode: string, playerName?: string): void {
    this.socket?.emit('join_room', { roomCode, playerName });
  }

  leaveRoom(): void {
    this.socket?.emit('leave_room');
  }

  giveUp(): void {
    this.socket?.emit('give_up');
  }

  // Queue management
  joinQueue(playerName?: string): void {
    this.socket?.emit('join_queue', playerName);
  }

  leaveQueue(): void {
    this.socket?.emit('leave_queue');
  }

  // Game actions
  makeMove(boardIndex: number, cellIndex: number): void {
    this.socket?.emit('make_move', { boardIndex, cellIndex });
  }

  restartGame(): void {
    this.socket?.emit('restart_game');
  }

  // Spectating
  spectateRoom(roomCode: string, spectatorName?: string): void {
    this.socket?.emit('spectate_room', { roomCode, spectatorName });
  }

  stopSpectating(): void {
    this.socket?.emit('stop_spectating');
  }

  // Event listeners
  onRoomCreated(callback: (data: { roomCode: string; room: any }) => void): void {
    this.registerEventListener('room_created', callback);
  }

  onRoomJoined(callback: (data: { room: any; playerSymbol: 'X' | 'O' }) => void): void {
    this.registerEventListener('room_joined', callback);
  }

  onRoomJoinError(callback: (error: string) => void): void {
    this.registerEventListener('room_join_error', callback);
  }

  onGameUpdate(callback: (gameState: GameSnapshot) => void): void {
    this.registerEventListener('game_update', callback);
  }

  onPlayerJoined(callback: (data: { player: any; room: any }) => void): void {
    this.registerEventListener('player_joined', callback);
  }

  onPlayerLeft(callback: (data: { playerId: string; room: any }) => void): void {
    this.registerEventListener('player_left', callback);
  }

  onGameStarted(callback: (room: any) => void): void {
    this.registerEventListener('game_started', callback);
  }

  onGameFinished(callback: (data: { winner: string | null; room: any }) => void): void {
    this.registerEventListener('game_finished', callback);
  }

  onSpectatorJoined(callback: (spectator: any) => void): void {
    this.registerEventListener('spectator_joined', callback);
  }

  onSpectatorLeft(callback: (spectatorId: string) => void): void {
    this.registerEventListener('spectator_left', callback);
  }

  onRoomError(callback: (error: string) => void): void {
    this.registerEventListener('room_error', callback);
  }

  onLeaderboardUpdated(callback: (leaderboard: Array<{ name: string; points: number; wins: number; losses: number; draws: number; gamesPlayed: number }>) => void): void {
    this.registerEventListener('leaderboard_updated', callback);
  }

  onQueueJoined(callback: () => void): void {
    this.registerEventListener('queue_joined', callback);
  }

  onQueueLeft(callback: () => void): void {
    this.registerEventListener('queue_left', callback);
  }

  onMatchFound(callback: (data: { roomCode: string; room: any; playerSymbol: 'X' | 'O' }) => void): void {
    this.registerEventListener('match_found', callback);
  }

  // Remove listeners
  offRoomCreated(): void {
    this.socket?.off('room_created');
  }

  offRoomJoined(): void {
    this.socket?.off('room_joined');
  }

  offRoomJoinError(): void {
    this.socket?.off('room_join_error');
  }

  offGameUpdate(): void {
    this.socket?.off('game_update');
  }

  offPlayerJoined(): void {
    this.socket?.off('player_joined');
  }

  offPlayerLeft(): void {
    this.socket?.off('player_left');
  }

  offGameStarted(): void {
    this.socket?.off('game_started');
  }

  offGameFinished(): void {
    this.socket?.off('game_finished');
  }

  offSpectatorJoined(): void {
    this.socket?.off('spectator_joined');
  }

  offSpectatorLeft(): void {
    this.socket?.off('spectator_left');
  }

  offRoomError(): void {
    this.socket?.off('room_error');
  }

  // Utility
  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const gameSocket = new GameSocketService();