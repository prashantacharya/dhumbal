/**
 * Client-side Game Logic Utilities
 * Mirror of backend gameLogic.js for client-side validation
 */

export interface Card {
  suit: string;
  rank: string;
  id: string;
}

export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

/**
 * Get card value according to Dhumbal rules
 */
export function getCardValue(card: Card): number {
  const rank = card.rank;
  if (rank === 'A') return 1;
  if (rank === 'J') return 11;
  if (rank === 'Q') return 12;
  if (rank === 'K') return 13;
  return parseInt(rank, 10);
}

/**
 * Calculate total hand value
 */
export function calculateHandValue(hand: Card[]): number {
  return hand.reduce((total, card) => total + getCardValue(card), 0);
}

/**
 * Check if cards form a valid set (pairs, triples, quads of same rank)
 */
export function isValidSet(cards: Card[]): boolean {
  if (cards.length < 2 || cards.length > 4) return false;
  
  const ranks = cards.map(card => card.rank);
  const uniqueRanks = new Set(ranks);
  
  return uniqueRanks.size === 1;
}

/**
 * Check if cards form a valid sequence (3+ cards of same suit in consecutive order)
 */
export function isValidSequence(cards: Card[]): boolean {
  if (cards.length < 3) return false;
  
  const suits = cards.map(card => card.suit);
  const uniqueSuits = new Set(suits);
  
  if (uniqueSuits.size !== 1) return false;
  
  const rankValues = cards.map(card => {
    const rank = card.rank;
    if (rank === 'A') return 1;
    if (rank === 'J') return 11;
    if (rank === 'Q') return 12;
    if (rank === 'K') return 13;
    return parseInt(rank, 10);
  }).sort((a, b) => a - b);
  
  for (let i = 1; i < rankValues.length; i++) {
    if (rankValues[i] !== rankValues[i - 1] + 1) {
      return false;
    }
  }
  
  return true;
}

/**
 * Validate if dropped cards are legal
 */
export function validateDrop(cards: Card[]): { valid: boolean; reason?: string; type?: string } {
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
 */
export function canDeclare(hand: Card[]): boolean {
  const handValue = calculateHandValue(hand);
  return handValue <= 5;
}

/**
 * Get card display name
 */
export function getCardDisplayName(card: Card): string {
  return `${card.rank}${getSuitSymbol(card.suit)}`;
}

/**
 * Get suit symbol/emoji
 */
export function getSuitSymbol(suit: string): string {
  switch (suit) {
    case 'hearts':
      return '♥';
    case 'diamonds':
      return '♦';
    case 'clubs':
      return '♣';
    case 'spades':
      return '♠';
    default:
      return '';
  }
}

/**
 * Get suit color class
 */
export function getSuitColor(suit: string): string {
  return suit === 'hearts' || suit === 'diamonds' ? 'text-red-600' : 'text-black';
}

/**
 * Get card image path
 * Maps card object to the corresponding image filename
 */
export function getCardImagePath(card: Card | null, faceUp: boolean = true): string {
  if (!card) {
    return '/assets/card_empty.png';
  }
  
  if (!faceUp) {
    return '/assets/card_back.png';
  }
  
  // Format rank: A stays A, 2-9 becomes 02-09, 10 stays 10, J/Q/K stay as is
  let rankFormatted = card.rank;
  
  // Check if it's a face card or ace
  if (rankFormatted === 'A' || rankFormatted === 'J' || rankFormatted === 'Q' || rankFormatted === 'K') {
    // Face cards and ace stay as is
  } else if (rankFormatted === '10') {
    // 10 stays as 10
    rankFormatted = '10';
  } else {
    // Numbers 2-9 need zero padding
    const num = parseInt(rankFormatted, 10);
    if (!isNaN(num) && num >= 2 && num <= 9) {
      rankFormatted = `0${num}`;
    }
  }
  
  return `/assets/card_${card.suit}_${rankFormatted}.png`;
}
