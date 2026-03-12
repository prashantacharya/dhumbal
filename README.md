# Dhumbal - Multiplayer Card Game

A full-stack real-time multiplayer web application for the Nepalese card game "Dhumbal" (Jhyap).

## Project Structure

```
dhumbal/
├── backend/
│   ├── server.js              # Express + Socket.io server
│   ├── gameLogic.js           # Game rules and validation utilities
│   ├── gameState.js           # Game state management
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx       # Main entry point
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── Lobby.tsx      # Room creation/joining
│   │   │   ├── GameBoard.tsx  # Main game interface
│   │   │   ├── Card.tsx       # Card component with animations
│   │   │   ├── PlayerSeat.tsx  # Player avatar in circular layout
│   │   │   ├── Scoreboard.tsx # Round history and scores
│   │   │   └── TurnTimer.tsx  # 30-second turn countdown
│   │   ├── hooks/
│   │   │   └── useSocket.ts   # Socket.io React hook
│   │   ├── store/
│   │   │   └── gameStore.ts   # Zustand state management
│   │   └── utils/
│   │       └── gameLogic.ts   # Client-side game logic helpers
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── next.config.js
│   └── .env.example
└── README.md
```

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express
- **Real-time**: Socket.io
- **State Management**: Zustand

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Update `.env` with your settings (optional):
```
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

5. Start the server:
```bash
npm start
```

The backend server will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your backend URL:
```
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

5. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## How to Play

1. **Create or Join Room**: Enter your name and either create a new room or join with a room code
2. **Wait for Players**: 2-5 players can join a room
3. **Ready Up**: All players must click "Ready" to start
4. **Play**: 
   - Select cards to drop (single card, set, or sequence)
   - After dropping, pick a card from deck or throw pile
   - Declare "Dhumbal" when your hand value is ≤ 5
5. **Win**: Lowest total score wins (game ends when someone reaches 100)

## Game Rules

- **Deck**: Standard 52-card deck
- **Deal**: 5 cards to each player
- **Card Values**: 
  - Ace = 1
  - 2-10 = Face value
  - J = 11, Q = 12, K = 13
- **Objective**: Have the lowest total hand value
- **Dropping Cards**: 
  - Single card
  - Set (pairs, triples, quads of same rank)
  - Sequence (3+ consecutive cards of same suit)
- **Picking Cards**: After dropping, must pick from deck or last thrown card
- **Declaring (Dhumbal)**: 
  - Can declare if hand value ≤ 5
  - If declarer has lowest: 0 points
  - If another player has ≤ declarer: declarer gets +25 + hand value penalty
- **Winning**: Game continues in rounds until a player reaches target score (100). Lowest total score wins.

## Features

✅ Real-time multiplayer with Socket.io  
✅ Room system with unique codes  
✅ Circular table layout  
✅ Turn-based gameplay with 30-second timer  
✅ Card animations with Framer Motion  
✅ Drag-and-drop card selection  
✅ Scoreboard with round history  
✅ Server-side validation to prevent cheating  

## Development

### Backend Scripts
- `npm start` - Start production server
- `npm run dev` - Start with auto-reload (Node 18+)

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Architecture

### Backend
- **server.js**: Main Express server with Socket.io event handlers
- **gameState.js**: GameRoom and RoomManager classes for state management
- **gameLogic.js**: Pure functions for game rules and validation

### Frontend
- **Zustand Store**: Centralized state management
- **Socket Hook**: React hook for Socket.io connection
- **Components**: Modular React components with Framer Motion animations
- **Game Logic**: Client-side validation (mirrors backend for UX)

## License

ISC
