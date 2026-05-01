# Ultimate Tic-Tac-Toe - Real-time Multiplayer

A fully functional real-time multiplayer Ultimate Tic-Tac-Toe game with a sleek sci-fi UI, built with React, Socket.IO, and Node.js.

## Features

### 🎮 Game Modes
- **Local Play**: Single-player against AI (Easy, Medium, Hard) or AI vs AI
- **Multiplayer**: Real-time PvP with friends via room codes

### 🌐 Multiplayer Features
- Create/join rooms with unique 6-character codes
- Real-time game synchronization
- Spectator mode support
- Automatic reconnection handling
- Room management with player disconnect handling

### 🎨 UI/UX
- Neon sci-fi theme with glassmorphism effects
- Smooth Framer Motion animations
- Responsive design
- Sound effects and visual feedback
- Confetti celebrations for wins

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Zustand** for state management
- **Socket.IO Client** for real-time communication

### Backend
- **Node.js** with Express
- **Socket.IO** for WebSocket communication
- **TypeScript** for type safety
- In-memory room management (ready for Redis)

## Project Structure

```
/
├── server/                 # Backend server
│   ├── src/
│   │   ├── game/          # Game logic and room management
│   │   ├── sockets/       # Socket event handlers
│   │   └── server.ts      # Main server file
│   └── package.json
├── src/                   # Frontend React app
│   ├── components/        # React components
│   │   ├── multiplayer/   # Multiplayer-specific components
│   │   └── ...
│   ├── services/          # Socket service
│   ├── store/            # Zustand stores
│   └── ...
└── package.json
```

## Local Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Environment Variables

Create `.env` file in the server directory:

```env
PORT=3001
CLIENT_URL=http://localhost:5173
```

### 3. Run the Application

#### Option A: Run both frontend and backend
```bash
# Terminal 1: Start the backend server
cd server
npm run dev

# Terminal 2: Start the frontend
npm run dev
```

#### Option B: Use concurrently (requires installing concurrently globally)
```bash
npm install -g concurrently
npm run dev:multiplayer
```

### 4. Access the Game

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

## How to Play

### Local Game
1. Select "Local Game" mode
2. Choose your opponent (PvP, AI Easy/Medium/Hard, or AI vs AI)
3. Click on cells to make moves
4. Use UNDO/RESET GAME controls as needed

### Multiplayer Game
1. Select "Multiplayer" mode
2. Enter your name
3. Choose "Create Room" or "Join Room"
4. If creating: Share the 6-character room code with a friend
5. If joining: Enter the room code provided by your friend
6. Wait for both players to connect
7. Game starts automatically when ready

## Game Rules

Ultimate Tic-Tac-Toe follows these rules:
1. There are 9 small 3x3 boards arranged in a 3x3 grid
2. Players take turns placing X's and O's in the small boards
3. When you get three in a row in a small board, you claim that board
4. The first player to claim three small boards in a row wins
5. If a small board is already claimed, you can play anywhere
6. Otherwise, you must play in the board corresponding to your opponent's last move

## Deployment

### Backend (Node.js)
Deploy to services like Railway, Render, or Heroku:

```bash
cd server
npm run build
npm start
```

Set environment variables:
- `PORT`: Server port (provided by hosting service)
- `CLIENT_URL`: Your frontend URL (e.g., `https://your-app.vercel.app`)

### Frontend (React)
Deploy to Vercel, Netlify, or similar:

```bash
npm run build
# Deploy the dist/ folder
```

Update the Socket.IO client connection URL to point to your backend.

## API Reference

### Socket Events

#### Client → Server
- `create_room` - Create a new game room
- `join_room` - Join an existing room
- `leave_room` - Leave current room
- `make_move` - Make a game move
- `restart_game` - Restart the current game
- `spectate_room` - Join as spectator
- `stop_spectating` - Stop spectating

#### Server → Client
- `room_created` - Room creation successful
- `room_joined` - Successfully joined room
- `room_join_error` - Failed to join room
- `game_update` - Game state update
- `game_started` - Game has begun
- `game_finished` - Game has ended
- `player_joined` - New player joined
- `player_left` - Player left room
- `spectator_joined` - Spectator joined
- `spectator_left` - Spectator left

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for learning or commercial purposes.

---

Enjoy playing Ultimate Tic-Tac-Toe! 🚀
