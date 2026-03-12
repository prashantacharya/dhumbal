/**
 * Dhumbal Backend Server
 * Express + Socket.io server for real-time multiplayer card game
 */
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { RoomManager } from './gameState.js';
import { validateDrop, canDeclare, calculateRoundScores } from './gameLogic.js';
dotenv.config();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});
app.use(cors());
app.use(express.json());
const roomManager = new RoomManager();
const playerRooms = new Map(); // Map socket.id -> roomId
// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    // Create room
    socket.on('create-room', ({ playerName }) => {
        try {
            const roomId = roomManager.generateRoomCode();
            const result = roomManager.createRoom(roomId, socket.id, playerName);
            if (result.success && result.room) {
                socket.join(roomId);
                playerRooms.set(socket.id, roomId);
                const room = result.room;
                socket.emit('room-created', {
                    roomId,
                    playerState: room.getPlayerState(socket.id)
                });
                // Notify others in room
                socket.to(roomId).emit('player-joined', {
                    publicState: room.getPublicState()
                });
                console.log(`Room created: ${roomId} by ${playerName}`);
            }
            else {
                socket.emit('error', { message: result.reason });
            }
        }
        catch (error) {
            console.error('Error creating room:', error);
            socket.emit('error', { message: 'Failed to create room' });
        }
    });
    // Join room
    socket.on('join-room', ({ roomId, playerName }) => {
        try {
            const room = roomManager.getRoom(roomId);
            if (!room) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }
            const result = room.addPlayer(socket.id, playerName);
            if (result.success) {
                socket.join(roomId);
                playerRooms.set(socket.id, roomId);
                socket.emit('room-joined', {
                    roomId,
                    playerState: room.getPlayerState(socket.id)
                });
                // Notify all players in room
                io.to(roomId).emit('player-joined', {
                    publicState: room.getPublicState()
                });
                console.log(`Player ${playerName} joined room ${roomId}`);
            }
            else {
                socket.emit('error', { message: result.reason });
            }
        }
        catch (error) {
            console.error('Error joining room:', error);
            socket.emit('error', { message: 'Failed to join room' });
        }
    });
    // Leave room
    socket.on('leave-room', () => {
        try {
            const roomId = playerRooms.get(socket.id);
            if (!roomId)
                return;
            const room = roomManager.getRoom(roomId);
            if (room) {
                room.removePlayer(socket.id);
                // If room is empty, delete it
                if (room.players.length === 0) {
                    roomManager.deleteRoom(roomId);
                    console.log(`Room deleted: ${roomId}`);
                }
                else {
                    // Notify remaining players
                    io.to(roomId).emit('player-left', {
                        publicState: room.getPublicState()
                    });
                }
            }
            socket.leave(roomId);
            playerRooms.delete(socket.id);
            socket.emit('room-left');
        }
        catch (error) {
            console.error('Error leaving room:', error);
        }
    });
    // Set player ready
    socket.on('set-ready', ({ ready }) => {
        try {
            const roomId = playerRooms.get(socket.id);
            if (!roomId) {
                socket.emit('error', { message: 'Not in a room' });
                return;
            }
            const room = roomManager.getRoom(roomId);
            if (!room) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }
            room.setPlayerReady(socket.id, ready);
            // Notify all players
            io.to(roomId).emit('player-ready', {
                publicState: room.getPublicState()
            });
            // Auto-start if all ready
            if (room.canStartGame()) {
                const startResult = room.startGame();
                if (startResult.success) {
                    io.to(roomId).emit('game-started', {
                        publicState: room.getPublicState()
                    });
                    // Send individual player states
                    for (const player of room.players) {
                        io.to(player.id).emit('game-state-update', {
                            playerState: room.getPlayerState(player.id)
                        });
                    }
                }
            }
        }
        catch (error) {
            console.error('Error setting ready:', error);
            socket.emit('error', { message: 'Failed to set ready status' });
        }
    });
    // Drop cards
    socket.on('drop-cards', ({ cardIds }) => {
        try {
            const roomId = playerRooms.get(socket.id);
            if (!roomId) {
                socket.emit('error', { message: 'Not in a room' });
                return;
            }
            const room = roomManager.getRoom(roomId);
            if (!room) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }
            // Get player's hand to validate
            const player = room.players.find(p => p.id === socket.id);
            if (!player) {
                socket.emit('error', { message: 'Player not found' });
                return;
            }
            const cardsToDrop = player.hand.filter(c => cardIds.includes(c.id));
            // Validate drop
            const validation = validateDrop(cardsToDrop);
            if (!validation.valid) {
                socket.emit('error', { message: validation.reason });
                return;
            }
            // Drop cards
            const result = room.dropCards(socket.id, cardIds);
            if (result.success) {
                // Notify all players
                io.to(roomId).emit('cards-dropped', {
                    playerId: socket.id,
                    playerName: player.name,
                    droppedCards: result.droppedCards,
                    publicState: room.getPublicState()
                });
                // Send updated state to the player who dropped
                socket.emit('game-state-update', {
                    playerState: room.getPlayerState(socket.id)
                });
            }
            else {
                socket.emit('error', { message: result.reason });
            }
        }
        catch (error) {
            console.error('Error dropping cards:', error);
            socket.emit('error', { message: 'Failed to drop cards' });
        }
    });
    // Pick card
    socket.on('pick-card', ({ fromDeck, cardId }) => {
        try {
            const roomId = playerRooms.get(socket.id);
            if (!roomId) {
                socket.emit('error', { message: 'Not in a room' });
                return;
            }
            const room = roomManager.getRoom(roomId);
            if (!room) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }
            // Validate that if picking from throw pile with multiple cards, cardId must be provided
            if (!fromDeck) {
                const lastThrown = room.lastThrownCards || [];
                if (lastThrown.length > 1 && !cardId) {
                    socket.emit('error', { message: 'Please select a card to pick' });
                    return;
                }
                // If cardId is provided, validate it exists
                if (cardId) {
                    const cardExists = lastThrown.some(c => c.id === cardId);
                    if (!cardExists) {
                        socket.emit('error', { message: 'Card not available to pick' });
                        return;
                    }
                }
            }
            const result = room.pickCard(socket.id, fromDeck, cardId);
            if (result.success) {
                // Notify all players
                io.to(roomId).emit('card-picked', {
                    playerId: socket.id,
                    fromDeck,
                    cardId,
                    publicState: room.getPublicState()
                });
                // Send updated state to all players
                for (const player of room.players) {
                    io.to(player.id).emit('game-state-update', {
                        playerState: room.getPlayerState(player.id)
                    });
                }
            }
            else {
                socket.emit('error', { message: result.reason });
            }
        }
        catch (error) {
            console.error('Error picking card:', error);
            socket.emit('error', { message: 'Failed to pick card' });
        }
    });
    // Declare (Dhumbal)
    socket.on('declare', () => {
        try {
            const roomId = playerRooms.get(socket.id);
            if (!roomId) {
                socket.emit('error', { message: 'Not in a room' });
                return;
            }
            const room = roomManager.getRoom(roomId);
            if (!room) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }
            const player = room.players.find(p => p.id === socket.id);
            if (!player) {
                socket.emit('error', { message: 'Player not found' });
                return;
            }
            // Check if can declare
            if (!canDeclare(player.hand)) {
                socket.emit('error', { message: 'Hand value must be ≤ 5 to declare' });
                return;
            }
            const result = room.declare(socket.id);
            if (result.success) {
                // Calculate round scores
                const roundScores = calculateRoundScores(room.players, socket.id);
                const endResult = room.endRound(roundScores);
                // Notify all players
                io.to(roomId).emit('declared', {
                    playerId: socket.id,
                    playerName: player.name,
                    handValue: result.handValue,
                    roundScores,
                    gameOver: endResult.gameOver,
                    publicState: room.getPublicState()
                });
                // Send updated state to all players
                for (const player of room.players) {
                    io.to(player.id).emit('game-state-update', {
                        playerState: room.getPlayerState(player.id)
                    });
                }
            }
            else {
                socket.emit('error', { message: result.reason });
            }
        }
        catch (error) {
            console.error('Error declaring:', error);
            socket.emit('error', { message: 'Failed to declare' });
        }
    });
    // Request game state update
    socket.on('request-state', () => {
        try {
            const roomId = playerRooms.get(socket.id);
            if (!roomId)
                return;
            const room = roomManager.getRoom(roomId);
            if (!room)
                return;
            socket.emit('game-state-update', {
                playerState: room.getPlayerState(socket.id)
            });
        }
        catch (error) {
            console.error('Error requesting state:', error);
        }
    });
    // Handle disconnection
    socket.on('disconnect', () => {
        try {
            const roomId = playerRooms.get(socket.id);
            if (roomId) {
                const room = roomManager.getRoom(roomId);
                if (room) {
                    room.removePlayer(socket.id);
                    // If room is empty, delete it
                    if (room.players.length === 0) {
                        roomManager.deleteRoom(roomId);
                        console.log(`Room deleted on disconnect: ${roomId}`);
                    }
                    else {
                        // Notify remaining players
                        io.to(roomId).emit('player-left', {
                            publicState: room.getPublicState()
                        });
                    }
                }
            }
            playerRooms.delete(socket.id);
            console.log(`Client disconnected: ${socket.id}`);
        }
        catch (error) {
            console.error('Error handling disconnect:', error);
        }
    });
});
// Timer check interval - check every second for expired turns
setInterval(() => {
    for (const [roomId, room] of roomManager.rooms.entries()) {
        if (room && room.gameState === 'playing') {
            const autoPlayed = room.checkAndAutoPlay();
            if (autoPlayed) {
                // Notify all players in the room about the auto-play
                io.to(roomId).emit('auto-played', {
                    playerId: room.currentTurn,
                    publicState: room.getPublicState()
                });
                // Send updated state to all players
                for (const player of room.players) {
                    io.to(player.id).emit('game-state-update', {
                        playerState: room.getPlayerState(player.id)
                    });
                }
            }
        }
    }
}, 1000); // Check every second
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`🚀 Dhumbal server running on port ${PORT}`);
    console.log(`📡 Socket.io server ready`);
    console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
});
