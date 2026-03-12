/**
 * Zustand Store for Game State Management
 */

import { create } from 'zustand';
import { Card } from '@/utils/gameLogic';

export interface Player {
  id: string;
  name: string;
  handCount: number;
  totalScore: number;
  isReady: boolean;
}

export interface GameState {
  roomId: string | null;
  playerId: string | null;
  playerName: string | null;
  hand: Card[];
  players: Player[];
  gameState: 'waiting' | 'playing' | 'roundEnd' | 'gameEnd';
  currentTurn: string | null;
  turnStartTime: number | null;
  throwPileCount: number;
  lastThrownCards: Card[];
  lastThrownPlayerId: string | null;
  deckCount: number;
  roundNumber: number;
  roundHistory: any[];
  declarerId: string | null;
  isCurrentTurn: boolean;
  error: string | null;
}

interface GameStore extends GameState {
  setRoomId: (roomId: string | null) => void;
  setPlayerId: (playerId: string | null) => void;
  setPlayerName: (name: string | null) => void;
  setHand: (hand: Card[]) => void;
  setPlayers: (players: Player[]) => void;
  setGameState: (state: GameState['gameState']) => void;
  setCurrentTurn: (playerId: string | null) => void;
  setTurnStartTime: (time: number | null) => void;
  setThrowPileCount: (count: number) => void;
  setLastThrownCards: (cards: Card[]) => void;
  setLastThrownPlayerId: (playerId: string | null) => void;
  setDeckCount: (count: number) => void;
  setRoundNumber: (round: number) => void;
  setRoundHistory: (history: any[]) => void;
  setDeclarerId: (playerId: string | null) => void;
  setIsCurrentTurn: (isTurn: boolean) => void;
  setError: (error: string | null) => void;
  updateFromPublicState: (publicState: any) => void;
  updateFromPlayerState: (playerState: any) => void;
  reset: () => void;
}

const initialState: GameState = {
  roomId: null,
  playerId: null,
  playerName: null,
  hand: [],
  players: [],
  gameState: 'waiting',
  currentTurn: null,
  turnStartTime: null,
  throwPileCount: 0,
  lastThrownCards: [],
  lastThrownPlayerId: null,
  deckCount: 0,
  roundNumber: 0,
  roundHistory: [],
  declarerId: null,
  isCurrentTurn: false,
  error: null,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  setRoomId: (roomId) => set({ roomId }),
  setPlayerId: (playerId) => set({ playerId }),
  setPlayerName: (name) => set({ playerName: name }),
  setHand: (hand) => set({ hand }),
  setPlayers: (players) => set({ players }),
  setGameState: (gameState) => set({ gameState }),
  setCurrentTurn: (currentTurn) => set({ currentTurn }),
  setTurnStartTime: (turnStartTime) => set({ turnStartTime }),
  setThrowPileCount: (throwPileCount) => set({ throwPileCount }),
  setLastThrownCards: (lastThrownCards) => set({ lastThrownCards }),
  setLastThrownPlayerId: (lastThrownPlayerId) => set({ lastThrownPlayerId }),
  setDeckCount: (deckCount) => set({ deckCount }),
  setRoundNumber: (roundNumber) => set({ roundNumber }),
  setRoundHistory: (roundHistory) => set({ roundHistory }),
  setDeclarerId: (declarerId) => set({ declarerId }),
  setIsCurrentTurn: (isCurrentTurn) => set({ isCurrentTurn }),
  setError: (error) => set({ error }),

  updateFromPublicState: (publicState) => {
    set({
      players: publicState.players || [],
      gameState: publicState.gameState || 'waiting',
      currentTurn: publicState.currentTurn || null,
      turnStartTime: publicState.turnStartTime || null,
      throwPileCount: publicState.throwPileCount || 0,
      lastThrownCards: publicState.lastThrownCards || [],
      lastThrownPlayerId: publicState.lastThrownPlayerId || null,
      deckCount: publicState.deckCount || 0,
      roundNumber: publicState.roundNumber || 0,
      roundHistory: publicState.roundHistory || [],
      declarerId: publicState.declarerId || null,
    });
  },

  updateFromPlayerState: (playerState) => {
    if (!playerState) return;
    
    set({
      roomId: playerState.roomId || null,
      hand: playerState.hand || [],
      players: playerState.players || [],
      gameState: playerState.gameState || 'waiting',
      currentTurn: playerState.currentTurn || null,
      turnStartTime: playerState.turnStartTime || null,
      throwPileCount: playerState.throwPileCount || 0,
      lastThrownCards: playerState.lastThrownCards || [],
      lastThrownPlayerId: playerState.lastThrownPlayerId || null,
      deckCount: playerState.deckCount || 0,
      roundNumber: playerState.roundNumber || 0,
      roundHistory: playerState.roundHistory || [],
      declarerId: playerState.declarerId || null,
      isCurrentTurn: playerState.isCurrentTurn || false,
    });
  },

  reset: () => set(initialState),
}));
