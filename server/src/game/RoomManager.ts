import { v4 as uuidv4 } from 'uuid';
import { applyMove, createEmptySnapshot, GameSnapshot } from '../gameLogic';
import { GameRoom, Player, RoomManager, Spectator } from './types';

export class InMemoryRoomManager implements RoomManager {
  private rooms = new Map<string, GameRoom>();
  private playerToRoom = new Map<string, string>();
  private spectatorToRoom = new Map<string, string>();

  createRoom(creatorId: string, creatorSocketId: string, creatorName?: string): GameRoom {
    const roomId = uuidv4();
    const roomCode = this.generateRoomCode();

    const player: Player = {
      id: creatorId,
      socketId: creatorSocketId,
      symbol: 'X',
      name: creatorName || 'Player X',
      connected: true,
      lastSeen: new Date(),
    };

    const room: GameRoom = {
      id: roomId,
      code: roomCode,
      players: [player],
      spectators: [],
      gameState: createEmptySnapshot(),
      status: 'waiting',
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    this.rooms.set(roomCode, room);
    this.playerToRoom.set(creatorId, roomCode);

    return room;
  }

  joinRoom(roomCode: string, playerId: string, socketId: string, playerName?: string): { success: boolean; room?: GameRoom; error?: string } {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.players.length >= 2) {
      return { success: false, error: 'Room is full' };
    }

    if (room.status !== 'waiting') {
      return { success: false, error: 'Game already in progress' };
    }

    // Check if player is already in the room
    const existingPlayer = room.players.find(p => p.id === playerId);
    if (existingPlayer) {
      existingPlayer.socketId = socketId;
      existingPlayer.connected = true;
      existingPlayer.name = playerName || existingPlayer.name || 'Player O';
      existingPlayer.lastSeen = new Date();
      return { success: true, room };
    }

    const player: Player = {
      id: playerId,
      socketId: socketId,
      symbol: 'O',
      name: playerName || 'Player O',
      connected: true,
      lastSeen: new Date(),
    };

    room.players.push(player);
    this.playerToRoom.set(playerId, roomCode);

    // If room now has 2 players, start the game
    if (room.players.length === 2) {
      room.status = 'playing';
    }

    room.lastActivity = new Date();

    return { success: true, room };
  }

  leaveRoom(roomCode: string, playerId: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== playerId);
    this.playerToRoom.delete(playerId);

    // If no players left, delete the room
    if (room.players.length === 0) {
      this.rooms.delete(roomCode);
      // Clean up spectators
      room.spectators.forEach(spec => this.spectatorToRoom.delete(spec.id));
    } else {
      // Reset to waiting if only one player left
      room.status = 'waiting';
      room.gameState = createEmptySnapshot();
    }
  }

  getRoom(roomCode: string): GameRoom | undefined {
    return this.rooms.get(roomCode);
  }

  getPlayerRoom(playerId: string): GameRoom | undefined {
    const roomCode = this.playerToRoom.get(playerId);
    return roomCode ? this.rooms.get(roomCode) : undefined;
  }

  updatePlayerConnection(playerId: string, socketId: string, connected: boolean): void {
    const roomCode = this.playerToRoom.get(playerId);
    if (!roomCode) return;

    const room = this.rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.socketId = socketId;
      player.connected = connected;
      player.lastSeen = new Date();
    }

    room.lastActivity = new Date();
  }

  addSpectator(roomCode: string, spectatorId: string, socketId: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    const spectator: Spectator = {
      id: spectatorId,
      socketId,
    };

    room.spectators.push(spectator);
    this.spectatorToRoom.set(spectatorId, roomCode);

    return true;
  }

  removeSpectator(roomCode: string, spectatorId: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    room.spectators = room.spectators.filter(s => s.id !== spectatorId);
    this.spectatorToRoom.delete(spectatorId);
  }

  makeMove(roomCode: string, playerId: string, boardIndex: number, cellIndex: number): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    if (room.status !== 'playing') return false;

    const player = room.players.find(p => p.id === playerId);
    if (!player || player.symbol !== room.gameState.currentPlayer) return false;

    const newState = applyMove(room.gameState, boardIndex, cellIndex);
    if (newState === room.gameState) return false; // Invalid move

    room.gameState = newState;
    room.lastActivity = new Date();

    // Check if game is finished
    if (newState.globalWinner) {
      room.status = 'finished';
    }

    return true;
  }

  restartGame(roomCode: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    room.gameState = createEmptySnapshot();
    room.status = room.players.length === 2 ? 'playing' : 'waiting';
    room.lastActivity = new Date();

    return true;
  }

  cleanupInactiveRooms(): void {
    const now = new Date();
    const timeout = 30 * 60 * 1000; // 30 minutes

    for (const [code, room] of this.rooms.entries()) {
      if (now.getTime() - room.lastActivity.getTime() > timeout) {
        this.rooms.delete(code);
        room.players.forEach(p => this.playerToRoom.delete(p.id));
        room.spectators.forEach(s => this.spectatorToRoom.delete(s.id));
      }
    }
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}