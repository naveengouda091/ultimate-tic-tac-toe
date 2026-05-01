import { GameSnapshot } from '../gameLogic';

export interface Player {
  id: string;
  socketId: string;
  symbol: 'X' | 'O';
  name?: string;
  connected: boolean;
  lastSeen: Date;
}

export interface Spectator {
  id: string;
  socketId: string;
  name?: string;
}

export interface GameRoom {
  id: string;
  code: string;
  players: Player[];
  spectators: Spectator[];
  gameState: GameSnapshot;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: Date;
  lastActivity: Date;
}

export interface RoomManager {
  createRoom(creatorId: string, creatorSocketId: string, creatorName?: string): GameRoom;
  joinRoom(roomCode: string, playerId: string, socketId: string, playerName?: string): { success: boolean; room?: GameRoom; error?: string };
  leaveRoom(roomCode: string, playerId: string): void;
  getRoom(roomCode: string): GameRoom | undefined;
  getPlayerRoom(playerId: string): GameRoom | undefined;
  updatePlayerConnection(playerId: string, socketId: string, connected: boolean): void;
  addSpectator(roomCode: string, spectatorId: string, socketId: string): boolean;
  removeSpectator(roomCode: string, spectatorId: string): void;
  makeMove(roomCode: string, playerId: string, boardIndex: number, cellIndex: number): boolean;
  restartGame(roomCode: string): boolean;
  cleanupInactiveRooms(): void;
}