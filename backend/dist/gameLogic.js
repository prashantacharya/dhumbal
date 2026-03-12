/**
 * Game Logic Utilities for Dhumbal
 * Handles card value calculation, set/sequence validation, and game rules
 */
export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
/**
 * Create a standard 52-card deck
 */
export function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ suit, rank, id: `${rank}-${suit}` });
        }
    }
    return shuffleDeck(deck);
}
/**
 * Shuffle deck using Fisher-Yates algorithm
 */
export function shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
/**
 * Get card value according to Dhumbal rules
 * Ace = 1, 2-10 = face value, J = 11, Q = 12, K = 13
 */
export function getCardValue(card) {
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
/**
 * Calculate total hand value
 */
export function calculateHandValue(hand) {
    return hand.reduce((total, card) => total + getCardValue(card), 0);
}
/**
 * Check if cards form a valid set (pairs, triples, quads of same rank)
 */
export function isValidSet(cards) {
    if (cards.length < 2 || cards.length > 4)
        return false;
    const ranks = cards.map(card => card.rank);
    const uniqueRanks = new Set(ranks);
    // All cards must have the same rank
    return uniqueRanks.size === 1;
}
/**
 * Check if cards form a valid sequence (3+ cards of same suit in consecutive order)
 */
export function isValidSequence(cards) {
    if (cards.length < 3)
        return false;
    const suits = cards.map(card => card.suit);
    const uniqueSuits = new Set(suits);
    // All cards must have the same suit
    if (uniqueSuits.size !== 1)
        return false;
    // Get rank values and sort them
    const rankValues = cards.map(card => {
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
    }).sort((a, b) => a - b);
    // Check if ranks are consecutive
    for (let i = 1; i < rankValues.length; i++) {
        if (rankValues[i] !== rankValues[i - 1] + 1) {
            return false;
        }
    }
    return true;
}
/**
 * Validate if dropped cards are legal
 * Can be: single card, valid set, or valid sequence
 */
export function validateDrop(cards) {
    if (!cards || cards.length === 0) {
        return { valid: false, reason: 'No cards selected' };
    }
    if (cards.length === 1) {
        return { valid: true, type: 'single' };
    }
    if (isValidSet(cards)) {
        return { valid: true, type: 'set' };
    }
    if (isValidSequence(cards)) {
        return { valid: true, type: 'sequence' };
    }
    return { valid: false, reason: 'Cards do not form a valid set or sequence' };
}
/**
 * Check if a player can declare (Dhumbal)
 * Hand value must be ≤ 5
 */
export function canDeclare(hand) {
    const handValue = calculateHandValue(hand);
    return handValue <= 5;
}
/**
 * Compare hands to determine round winner and calculate scores
 */
export function calculateRoundScores(players, declarerId) {
    const results = [];
    // Calculate hand values for all players
    for (const player of players) {
        const handValue = calculateHandValue(player.hand);
        results.push({
            playerId: player.id,
            playerName: player.name,
            handValue,
            score: 0
        });
    }
    // Find minimum hand value
    const minHandValue = Math.min(...results.map(r => r.handValue));
    // Check if declarer has the lowest
    const declarerResult = results.find(r => r.playerId === declarerId);
    const declarerHasLowest = !!declarerResult && declarerResult.handValue === minHandValue;
    // Check if any other player has equal or lower than declarer
    const otherPlayerHasLower = !!declarerResult && results.some(r => r.playerId !== declarerId && r.handValue <= declarerResult.handValue);
    // Calculate scores
    for (const result of results) {
        if (result.playerId === declarerId) {
            if (declarerHasLowest && !otherPlayerHasLower) {
                // Declarer wins: 0 points
                result.score = 0;
            }
            else {
                // Declarer penalty: +25 + hand value
                result.score = 25 + result.handValue;
            }
        }
        else {
            // Other players: their hand value
            result.score = result.handValue;
        }
    }
    return results;
}
