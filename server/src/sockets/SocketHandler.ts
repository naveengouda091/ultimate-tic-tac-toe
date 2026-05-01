import { Server, Socket } from 'socket.io';
import { InMemoryRoomManager } from '../game/RoomManager';
import { GameRoom } from '../game/types';

interface ClientToServerEvents {
  create_room: (playerName?: string) => void;
  join_room: (data: { roomCode: string; playerName?: string }) => void;
  leave_room: () => void;
  make_move: (data: { boardIndex: number; cellIndex: number }) => void;
  restart_game: () => void;
  spectate_room: (data: { roomCode: string; spectatorName?: string }) => void;
  stop_spectating: () => void;
  give_up: () => void;
  join_queue: (playerName?: string) => void;
  leave_queue: () => void;
}

interface ServerToClientEvents {
  room_created: (data: { roomCode: string; room: GameRoom }) => void;
  room_joined: (data: { room: GameRoom; playerSymbol: 'X' | 'O' }) => void;
  room_join_error: (error: string) => void;
  game_update: (gameState: any) => void;
  player_joined: (data: { player: any; room: GameRoom }) => void;
  player_left: (data: { playerId: string; room: GameRoom }) => void;
  game_started: (room: GameRoom) => void;
  game_finished: (data: { winner: string | null; room: GameRoom }) => void;
  spectator_joined: (spectator: any) => void;
  spectator_left: (spectatorId: string) => void;
  room_error: (error: string) => void;
  leaderboard_updated: (leaderboard: LeaderboardEntry[]) => void;
  queue_joined: () => void;
  queue_left: () => void;
  match_found: (data: { roomCode: string; room: GameRoom; playerSymbol: 'X' | 'O' }) => void;
}

interface InterServerEvents {}

interface SocketData {
  playerId?: string;
  playerName?: string;
  roomCode?: string;
  isSpectator?: boolean;
}

export interface LeaderboardEntry {
  name: string;
  points: number;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
}

export type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export class SocketHandler {
  private roomManager: InMemoryRoomManager;
  private leaderboard = new Map<string, LeaderboardEntry>();
  private queue: Array<{ socketId: string; playerId: string; playerName: string; socket: GameSocket }> = [];

  constructor(private io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) {
    this.roomManager = new InMemoryRoomManager();
    this.setupEventHandlers();

    // Cleanup inactive rooms every 5 minutes
    setInterval(() => {
      this.roomManager.cleanupInactiveRooms();
    }, 5 * 60 * 1000);
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: GameSocket) => {
      console.log(`Client connected: ${socket.id}`);

      // Generate a unique player ID for this socket
      const playerId = this.generatePlayerId();
      socket.data.playerId = playerId;

      // Handle room creation
      socket.on('create_room', (playerName) => {
        try {
          const name = playerName || 'Player X';
          socket.data.playerName = name;
          const room = this.roomManager.createRoom(playerId, socket.id, name);

          socket.data.roomCode = room.code;
          socket.join(room.code);

          socket.emit('room_created', { roomCode: room.code, room });
          this.emitLeaderboardUpdate();
          console.log(`Room created: ${room.code} by player ${playerId}`);
        } catch (error) {
          socket.emit('room_error', 'Failed to create room');
        }
      });

      // Handle room joining
      socket.on('join_room', (data) => {
        try {
          const name = data.playerName || 'Player O';
          socket.data.playerName = name;
          const result = this.roomManager.joinRoom(data.roomCode, playerId, socket.id, name);

          if (!result.success) {
            socket.emit('room_join_error', result.error || 'Unknown error');
            return;
          }

          const room = result.room!;
          socket.data.roomCode = room.code;
          socket.join(room.code);

          // Find the player in the room
          const player = room.players.find(p => p.id === playerId)!;

          socket.emit('room_joined', { room, playerSymbol: player.symbol });

          // Notify other players in the room
          socket.to(room.code).emit('player_joined', { player, room });

          // If game is now ready to start
          if (room.status === 'playing') {
            this.io.to(room.code).emit('game_started', room);
          }

          console.log(`Player ${playerId} joined room ${room.code}`);
        } catch (error) {
          socket.emit('room_error', 'Failed to join room');
        }
      });

      // Handle leaving room
      socket.on('leave_room', () => {
        const roomCode = socket.data.roomCode;
        if (!roomCode) return;

        this.roomManager.leaveRoom(roomCode, playerId);
        socket.data.roomCode = undefined;
        socket.leave(roomCode);

        // Notify others
        socket.to(roomCode).emit('player_left', { playerId, room: this.roomManager.getRoom(roomCode)! });

        console.log(`Player ${playerId} left room ${roomCode}`);
      });

      // Handle moves
      socket.on('make_move', (data) => {
        const roomCode = socket.data.roomCode;
        if (!roomCode) return;

        const success = this.roomManager.makeMove(roomCode, playerId, data.boardIndex, data.cellIndex);

        if (success) {
          const room = this.roomManager.getRoom(roomCode)!;

          // Emit game update to all players in room
          this.io.to(roomCode).emit('game_update', room.gameState);

          // Check if game finished
          if (room.status === 'finished') {
            const winnerSymbol = room.gameState.globalWinner;
            if (winnerSymbol === 'T') {
              const [playerA, playerB] = room.players;
              if (playerA && playerB) {
                this.recordResult(playerA.name || playerA.symbol, playerB.name || playerB.symbol, 'draw');
                this.emitLeaderboardUpdate();
              }
            } else {
              const winner = room.players.find((p) => p.symbol === winnerSymbol);
              const loser = room.players.find((p) => p.symbol !== winnerSymbol);
              if (winner && loser) {
                this.recordResult(winner.name || winner.symbol, loser.name || loser.symbol, 'win');
                this.emitLeaderboardUpdate();
              }
            }

            this.io.to(roomCode).emit('game_finished', {
              winner: room.gameState.globalWinner,
              room
            });
          }

          console.log(`Move made in room ${roomCode}: board ${data.boardIndex}, cell ${data.cellIndex}`);
        }
      });

      // Handle game restart
      socket.on('restart_game', () => {
        const roomCode = socket.data.roomCode;
        if (!roomCode) return;

        const success = this.roomManager.restartGame(roomCode);
        if (success) {
          const room = this.roomManager.getRoom(roomCode)!;
          this.io.to(roomCode).emit('game_update', room.gameState);
          console.log(`Game restarted in room ${roomCode}`);
        }
      });

      // Handle spectating
      socket.on('spectate_room', (data) => {
        try {
          const success = this.roomManager.addSpectator(data.roomCode, playerId, socket.id);

          if (!success) {
            socket.emit('room_error', 'Room not found');
            return;
          }

          socket.data.roomCode = data.roomCode;
          socket.data.isSpectator = true;
          socket.join(data.roomCode);

          const room = this.roomManager.getRoom(data.roomCode)!;
          socket.emit('game_update', room.gameState);

          socket.to(data.roomCode).emit('spectator_joined', { id: playerId, name: data.spectatorName });

          console.log(`Spectator ${playerId} joined room ${data.roomCode}`);
        } catch (error) {
          socket.emit('room_error', 'Failed to spectate room');
        }
      });

      // Handle giving up
      socket.on('give_up', () => {
        const roomCode = socket.data.roomCode;
        if (!roomCode) {
          socket.emit('room_error', 'You are not in a room');
          return;
        }

        const room = this.roomManager.getRoom(roomCode);
        if (!room) {
          socket.emit('room_error', 'Room not found');
          return;
        }

        const surrenderingPlayer = room.players.find((p) => p.id === playerId);
        const opponent = room.players.find((p) => p.id !== playerId);

        if (!surrenderingPlayer || !opponent) {
          socket.emit('room_error', 'Unable to surrender without an opponent');
          return;
        }

        room.status = 'finished';
        room.gameState.globalWinner = opponent.symbol;
        room.lastActivity = new Date();

        this.recordResult(opponent.name || opponent.symbol, surrenderingPlayer.name || surrenderingPlayer.symbol, 'surrender');
        this.emitLeaderboardUpdate();

        this.io.to(roomCode).emit('game_update', room.gameState);
        this.io.to(roomCode).emit('game_finished', { winner: opponent.symbol, room });

        console.log(`Player ${playerId} surrendered in room ${roomCode}`);
      });

      // Handle joining queue for random match
      socket.on('join_queue', (playerName) => {
        // Remove from queue if already in it
        this.queue = this.queue.filter(q => q.socketId !== socket.id);

        const name = playerName || 'Player';
        socket.data.playerName = name;

        this.queue.push({ socketId: socket.id, playerId, playerName: name, socket });
        socket.emit('queue_joined');

        console.log(`Player ${playerId} joined queue`);

        // Try to find a match
        this.tryFindMatch();
      });

      // Handle leaving queue
      socket.on('leave_queue', () => {
        this.queue = this.queue.filter(q => q.socketId !== socket.id);
        socket.emit('queue_left');
        console.log(`Player ${playerId} left queue`);
      });

      // Handle stopping spectating
      socket.on('stop_spectating', () => {
        const roomCode = socket.data.roomCode;
        if (!roomCode || !socket.data.isSpectator) return;

        this.roomManager.removeSpectator(roomCode, playerId);
        socket.data.roomCode = undefined;
        socket.data.isSpectator = false;
        socket.leave(roomCode);

        socket.to(roomCode).emit('spectator_left', playerId);

        console.log(`Spectator ${playerId} stopped spectating room ${roomCode}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);

        // Update player connection status
        this.roomManager.updatePlayerConnection(playerId, socket.id, false);

        // Note: We don't remove players immediately on disconnect to allow reconnection
        // The cleanup will happen periodically
      });
    });
  }

  private emitLeaderboardUpdate(): void {
    const leaderboard = this.getLeaderboard();
    this.io.emit('leaderboard_updated', leaderboard);
  }

  private recordResult(winnerName: string, loserName: string, type: 'win' | 'draw' | 'surrender'): void {
    const normalize = (name: string) => name.trim() || 'Anonymous';
    const winner = normalize(winnerName);
    const loser = normalize(loserName);

    const ensure = (playerName: string): LeaderboardEntry => {
      const existing = this.leaderboard.get(playerName);
      if (existing) return existing;
      const entry: LeaderboardEntry = {
        name: playerName,
        points: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        gamesPlayed: 0,
      };
      this.leaderboard.set(playerName, entry);
      return entry;
    };

    const winnerEntry = ensure(winner);
    const loserEntry = ensure(loser);

    if (type === 'draw') {
      winnerEntry.points += 1;
      loserEntry.points += 1;
      winnerEntry.draws += 1;
      loserEntry.draws += 1;
    } else {
      winnerEntry.points += 3;
      winnerEntry.wins += 1;
      loserEntry.losses += 1;
    }

    winnerEntry.gamesPlayed += 1;
    loserEntry.gamesPlayed += 1;
  }

  private getLeaderboard(): LeaderboardEntry[] {
    return Array.from(this.leaderboard.values())
      .sort((a, b) => b.points - a.points || b.wins - a.wins)
      .slice(0, 25);
  }

  public getLeaderboardSnapshot(): LeaderboardEntry[] {
    return this.getLeaderboard();
  }

  private tryFindMatch(): void {
    if (this.queue.length < 2) return;

    const player1 = this.queue.shift()!;
    const player2 = this.queue.shift()!;

    // Create a room for these two players
    const room = this.roomManager.createRoom(player1.playerId, player1.socketId, player1.playerName);

    // Add second player to the room
    const joinResult = this.roomManager.joinRoom(room.code, player2.playerId, player2.socketId, player2.playerName);

    if (!joinResult.success) {
      console.error('Failed to join second player to room:', joinResult.error);
      // Put players back in queue
      this.queue.unshift(player2);
      this.queue.unshift(player1);
      return;
    }

    const updatedRoom = joinResult.room!;

    // Set socket data
    player1.socket.data.roomCode = room.code;
    player2.socket.data.roomCode = room.code;

    // Join sockets to room
    player1.socket.join(room.code);
    player2.socket.join(room.code);

    // Notify players
    player1.socket.emit('match_found', { roomCode: room.code, room: updatedRoom, playerSymbol: 'X' });
    player2.socket.emit('match_found', { roomCode: room.code, room: updatedRoom, playerSymbol: 'O' });

    // Start the game
    this.io.to(room.code).emit('game_started', updatedRoom);

    console.log(`Match found: ${player1.playerId} vs ${player2.playerId} in room ${room.code}`);
  }

  private generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}