/**
 * Game State Management
 * Manages rooms, players, and game sessions
 */
import { createDeck } from './gameLogic.js';
export class GameRoom {
    roomId;
    players;
    gameState;
    deck;
    throwPile;
    lastThrownCards;
    lastThrownPlayerId;
    currentPlayerDroppedCards;
    currentTurn;
    turnStartTime;
    turnTimer;
    roundNumber;
    roundHistory;
    targetScore;
    declarerId;
    constructor(roomId, hostId, hostName) {
        this.roomId = roomId;
        this.players = [{
                id: hostId,
                name: hostName,
                hand: [],
                totalScore: 0,
                isReady: false
            }];
        this.gameState = 'waiting';
        this.deck = [];
        this.throwPile = [];
        this.lastThrownCards = [];
        this.lastThrownPlayerId = null;
        this.currentPlayerDroppedCards = [];
        this.currentTurn = null;
        this.turnStartTime = null;
        this.turnTimer = 30000; // 30 seconds
        this.roundNumber = 0;
        this.roundHistory = [];
        this.targetScore = 100;
        this.declarerId = null;
    }
    addPlayer(playerId, playerName) {
        if (this.players.length >= 5) {
            return { success: false, reason: 'Room is full (max 5 players)' };
        }
        if (this.players.some(p => p.id === playerId)) {
            return { success: false, reason: 'Player already in room' };
        }
        this.players.push({
            id: playerId,
            name: playerName,
            hand: [],
            totalScore: 0,
            isReady: false
        });
        return { success: true };
    }
    removePlayer(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
        // If host leaves, assign new host
        if (this.players.length > 0 && this.players[0].id !== playerId) {
            // Host is always first player
        }
        // If game is in progress and player leaves, handle accordingly
        if (this.gameState === 'playing' && this.currentTurn === playerId) {
            this.nextTurn();
        }
    }
    setPlayerReady(playerId, ready) {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            player.isReady = ready;
        }
    }
    canStartGame() {
        return this.players.length >= 2 &&
            this.players.length <= 5 &&
            this.players.every(p => p.isReady) &&
            this.gameState === 'waiting';
    }
    startGame() {
        if (!this.canStartGame()) {
            return { success: false, reason: 'Cannot start game' };
        }
        this.gameState = 'playing';
        this.roundNumber = 1;
        this.deck = createDeck();
        this.throwPile = [];
        this.lastThrownCards = [];
        this.lastThrownPlayerId = null;
        this.currentPlayerDroppedCards = [];
        // Deal 5 cards to each player
        for (const player of this.players) {
            player.hand = [];
            for (let i = 0; i < 5; i++) {
                const card = this.deck.pop();
                if (card) {
                    player.hand.push(card);
                }
            }
        }
        // Set first player's turn (first player)
        this.currentTurn = this.players[0].id;
        this.turnStartTime = Date.now();
        return { success: true };
    }
    dropCards(playerId, cardIds) {
        if (this.currentTurn !== playerId) {
            return { success: false, reason: 'Not your turn' };
        }
        if (this.gameState !== 'playing') {
            return { success: false, reason: 'Game not in progress' };
        }
        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            return { success: false, reason: 'Player not found' };
        }
        // Validate cards are in player's hand
        const cardsToDrop = [];
        for (const cardId of cardIds) {
            const cardIndex = player.hand.findIndex(c => c.id === cardId);
            if (cardIndex === -1) {
                return { success: false, reason: 'Card not in hand' };
            }
            cardsToDrop.push(player.hand[cardIndex]);
        }
        // Remove cards from hand
        player.hand = player.hand.filter(c => !cardIds.includes(c.id));
        // Add to throw pile
        this.throwPile.push(...cardsToDrop);
        // Store the cards dropped by current player
        // These will become lastThrownCards after the player picks
        this.currentPlayerDroppedCards = [...cardsToDrop];
        // IMPORTANT: Don't update lastThrownCards here!
        // The lastThrownCards should remain from the PREVIOUS player
        // until the current player picks. Only after picking should
        // the current player's dropped cards become available for next player.
        return {
            success: true,
            droppedCards: cardsToDrop,
            remainingHand: player.hand
        };
    }
    pickCard(playerId, fromDeck = true, cardIdToPick = null) {
        if (this.currentTurn !== playerId) {
            return { success: false, reason: 'Not your turn' };
        }
        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            return { success: false, reason: 'Player not found' };
        }
        let pickedCard = null;
        if (fromDeck) {
            if (this.deck.length === 0) {
                return { success: false, reason: 'Deck is empty' };
            }
            pickedCard = this.deck.pop() ?? null;
        }
        else {
            // Pick from last thrown cards (from previous player)
            // Note: lastThrownCards contains cards from the PREVIOUS player
            if (this.lastThrownCards.length === 0) {
                return { success: false, reason: 'No cards available to pick' };
            }
            // Cannot pick your own thrown cards
            if (this.lastThrownPlayerId === playerId) {
                return { success: false, reason: 'Cannot pick your own thrown cards' };
            }
            // If only one card was thrown, pick it automatically
            if (this.lastThrownCards.length === 1) {
                pickedCard = this.lastThrownCards.pop() ?? null;
                this.lastThrownPlayerId = null;
            }
            else {
                // Multiple cards thrown - require specific card selection
                if (!cardIdToPick) {
                    return { success: false, reason: 'Please select a card to pick' };
                }
                const cardIndex = this.lastThrownCards.findIndex(c => c.id === cardIdToPick);
                if (cardIndex === -1) {
                    return { success: false, reason: 'Card not found in last thrown cards' };
                }
                pickedCard = this.lastThrownCards[cardIndex] ?? null;
                this.lastThrownCards.splice(cardIndex, 1);
                // Clear last thrown cards if empty
                if (this.lastThrownCards.length === 0) {
                    this.lastThrownPlayerId = null;
                }
            }
            // Remove from throw pile as well
            if (pickedCard) {
                const throwPileIndex = this.throwPile.findIndex(c => c.id === pickedCard.id);
                if (throwPileIndex !== -1) {
                    this.throwPile.splice(throwPileIndex, 1);
                }
            }
        }
        if (pickedCard) {
            player.hand.push(pickedCard);
        }
        // After picking, update lastThrownCards to the cards this player dropped
        // (which are now available for the next player)
        if (this.currentPlayerDroppedCards.length > 0) {
            this.lastThrownCards = [...this.currentPlayerDroppedCards];
            this.lastThrownPlayerId = playerId;
            this.currentPlayerDroppedCards = [];
        }
        // Move to next turn (after picking, turn moves to next player)
        this.nextTurn();
        return {
            success: true,
            pickedCard,
            remainingHand: player.hand
        };
    }
    declare(playerId) {
        if (this.currentTurn !== playerId) {
            return { success: false, reason: 'Not your turn' };
        }
        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            return { success: false, reason: 'Player not found' };
        }
        const handValue = player.hand.reduce((sum, card) => {
            const rank = card.rank;
            if (rank === 'A')
                return sum + 1;
            if (rank === 'J')
                return sum + 11;
            if (rank === 'Q')
                return sum + 12;
            if (rank === 'K')
                return sum + 13;
            return sum + parseInt(rank, 10);
        }, 0);
        if (handValue > 5) {
            return { success: false, reason: 'Hand value must be ≤ 5 to declare' };
        }
        this.declarerId = playerId;
        this.gameState = 'roundEnd';
        return { success: true, handValue };
    }
    nextTurn() {
        const currentIndex = this.players.findIndex(p => p.id === this.currentTurn);
        const nextIndex = (currentIndex + 1) % this.players.length;
        this.currentTurn = this.players[nextIndex].id;
        this.turnStartTime = Date.now();
    }
    /**
     * Check if turn timer has expired and auto-play if needed
     * Returns true if auto-play was executed
     */
    checkAndAutoPlay() {
        if (this.gameState !== 'playing' || !this.currentTurn || !this.turnStartTime) {
            return false;
        }
        const elapsed = Date.now() - this.turnStartTime;
        if (elapsed < this.turnTimer) {
            return false; // Timer hasn't expired yet
        }
        const player = this.players.find(p => p.id === this.currentTurn);
        if (!player || player.hand.length === 0) {
            return false;
        }
        // Check if player has already dropped cards (waiting to pick)
        // If currentPlayerDroppedCards is set for this player, they've dropped and need to pick
        if (this.currentPlayerDroppedCards.length > 0) {
            // Player has dropped cards, now they need to pick
            // Auto-pick from deck (preferred) or from throw pile
            const pickResult = this.pickCard(this.currentTurn, true);
            if (!pickResult.success) {
                // If deck is empty, try picking from throw pile
                if (this.lastThrownCards.length > 0 && this.lastThrownPlayerId !== this.currentTurn) {
                    if (this.lastThrownCards.length === 1) {
                        this.pickCard(this.currentTurn, false);
                    }
                    else if (this.lastThrownCards.length > 1) {
                        // Pick the first available card
                        this.pickCard(this.currentTurn, false, this.lastThrownCards[0].id);
                    }
                }
            }
            return true;
        }
        // Player hasn't dropped cards yet, auto-drop highest card
        // Find highest value card
        let highestCard = player.hand[0];
        let highestValue = this.getCardValue(highestCard);
        for (const card of player.hand) {
            const value = this.getCardValue(card);
            if (value > highestValue) {
                highestValue = value;
                highestCard = card;
            }
        }
        // Auto-drop the highest card
        const dropResult = this.dropCards(this.currentTurn, [highestCard.id]);
        if (!dropResult.success) {
            return false;
        }
        // Immediately auto-pick from deck after dropping
        const pickResult = this.pickCard(this.currentTurn, true);
        if (!pickResult.success) {
            // If deck is empty, try picking from throw pile
            if (this.lastThrownCards.length > 0 && this.lastThrownPlayerId !== this.currentTurn) {
                if (this.lastThrownCards.length === 1) {
                    this.pickCard(this.currentTurn, false);
                }
                else if (this.lastThrownCards.length > 1) {
                    // Pick the first available card
                    this.pickCard(this.currentTurn, false, this.lastThrownCards[0].id);
                }
            }
        }
        return true;
    }
    /**
     * Get card value for comparison
     */
    getCardValue(card) {
        const rank = card.rank;
        if (rank === 'A')
            return 1;
        if (rank === 'J')
            return 11;
        if (rank === 'Q')
            return 12;
        if (rank === 'K')
            return 13;
        return parseInt(rank, 10);
    }
    endRound(roundScores) {
        // Update player scores
        for (const scoreResult of roundScores) {
            const player = this.players.find(p => p.id === scoreResult.playerId);
            if (player) {
                player.totalScore += scoreResult.score;
            }
        }
        // Add to round history
        this.roundHistory.push({
            roundNumber: this.roundNumber,
            scores: roundScores,
            declarerId: this.declarerId
        });
        // Check if game is over
        const gameOver = this.players.some(p => p.totalScore >= this.targetScore);
        if (gameOver) {
            this.gameState = 'gameEnd';
        }
        else {
            // Start next round
            this.roundNumber++;
            this.gameState = 'waiting';
            this.declarerId = null;
            this.throwPile = [];
            this.lastThrownCards = [];
            this.lastThrownPlayerId = null;
            this.currentPlayerDroppedCards = [];
            // Reset ready status
            for (const player of this.players) {
                player.isReady = false;
            }
        }
        return { gameOver };
    }
    getPublicState() {
        return {
            roomId: this.roomId,
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                handCount: p.hand.length,
                totalScore: p.totalScore,
                isReady: p.isReady
            })),
            gameState: this.gameState,
            currentTurn: this.currentTurn,
            turnStartTime: this.turnStartTime,
            throwPileCount: this.throwPile.length,
            lastThrownCards: this.lastThrownCards,
            lastThrownPlayerId: this.lastThrownPlayerId,
            deckCount: this.deck.length,
            roundNumber: this.roundNumber,
            roundHistory: this.roundHistory,
            declarerId: this.declarerId
        };
    }
    getPlayerState(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            return null;
        }
        return {
            ...this.getPublicState(),
            hand: player.hand,
            isCurrentTurn: this.currentTurn === playerId
        };
    }
}
// Room manager
export class RoomManager {
    rooms;
    constructor() {
        this.rooms = new Map();
    }
    createRoom(roomId, hostId, hostName) {
        if (this.rooms.has(roomId)) {
            return { success: false, reason: 'Room already exists' };
        }
        const room = new GameRoom(roomId, hostId, hostName);
        this.rooms.set(roomId, room);
        return { success: true, room };
    }
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    deleteRoom(roomId) {
        return this.rooms.delete(roomId);
    }
    generateRoomCode() {
        let code;
        do {
            code = Math.random().toString(36).substring(2, 8).toUpperCase();
        } while (this.rooms.has(code));
        return code;
    }
}
