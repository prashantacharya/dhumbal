/**
 * Game Board Component
 * Main game interface with circular table layout
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Socket } from 'socket.io-client';
import { useGameStore } from '@/store/gameStore';
import Card from './Card';
import PlayerSeat from './PlayerSeat';
import TurnTimer from './TurnTimer';
import Scoreboard from './Scoreboard';
import { Card as CardType, validateDrop, canDeclare, calculateHandValue } from '@/utils/gameLogic';

interface GameBoardProps {
  socket: Socket | null;
}

export default function GameBoard({ socket }: GameBoardProps) {
  const {
    roomId,
    playerId,
    hand,
    players,
    gameState,
    currentTurn,
    turnStartTime,
    lastThrownCards,
    lastThrownPlayerId,
    deckCount,
    roundNumber,
    isCurrentTurn,
    error,
    updateFromPublicState,
    updateFromPlayerState,
    setError,
  } = useGameStore();

  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [selectedCardToPick, setSelectedCardToPick] = useState<string | null>(null);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [waitingForPick, setWaitingForPick] = useState(false);
  
  // Cards available to pick are from the previous player (not current player)
  // Show card selection UI when:
  // 1. Waiting to pick
  // 2. Multiple cards were thrown by previous player
  // 3. Cards are not from current player
  const canPickFromThrown = lastThrownCards.length > 0 && lastThrownPlayerId !== playerId;
  const showCardSelection = waitingForPick && 
                            canPickFromThrown && 
                            lastThrownCards.length > 1;

  useEffect(() => {
    if (!socket) return;

    const handlePlayerJoined = (data: { publicState: any }) => {
      updateFromPublicState(data.publicState);
    };

    const handlePlayerLeft = (data: { publicState: any }) => {
      updateFromPublicState(data.publicState);
    };

    const handlePlayerReady = (data: { publicState: any }) => {
      updateFromPublicState(data.publicState);
    };

    const handleGameStarted = (data: { publicState: any }) => {
      updateFromPublicState(data.publicState);
      setSelectedCards([]);
      setWaitingForPick(false);
      setSelectedCardToPick(null);
    };

    const handleGameStateUpdate = (data: { playerState: any }) => {
      updateFromPlayerState(data.playerState);
    };

    const handleCardsDropped = (data: { 
      playerId: string; 
      playerName: string; 
      droppedCards: CardType[];
      publicState: any;
    }) => {
      updateFromPublicState(data.publicState);
      if (data.playerId === playerId) {
        setSelectedCards([]);
        setWaitingForPick(true);
        setSelectedCardToPick(null);
      }
    };

    const handleCardPicked = (data: { 
      playerId: string; 
      fromDeck: boolean;
      cardId?: string;
      publicState: any;
    }) => {
      updateFromPublicState(data.publicState);
      if (data.playerId === playerId) {
        setWaitingForPick(false);
        setSelectedCardToPick(null);
      }
    };

    const handleDeclared = (data: {
      playerId: string;
      playerName: string;
      handValue: number;
      roundScores: any[];
      gameOver: boolean;
      publicState: any;
    }) => {
      updateFromPublicState(data.publicState);
      setSelectedCards([]);
      setWaitingForPick(false);
      setSelectedCardToPick(null);
    };

    const handleError = (data: { message: string }) => {
      setError(data.message);
      setTimeout(() => setError(null), 5000);
    };

    socket.on('player-joined', handlePlayerJoined);
    socket.on('player-left', handlePlayerLeft);
    socket.on('player-ready', handlePlayerReady);
    socket.on('game-started', handleGameStarted);
    socket.on('game-state-update', handleGameStateUpdate);
    socket.on('cards-dropped', handleCardsDropped);
    socket.on('card-picked', handleCardPicked);
    socket.on('declared', handleDeclared);
    socket.on('error', handleError);

    // Request initial state
    socket.emit('request-state');

    return () => {
      socket.off('player-joined', handlePlayerJoined);
      socket.off('player-left', handlePlayerLeft);
      socket.off('player-ready', handlePlayerReady);
      socket.off('game-started', handleGameStarted);
      socket.off('game-state-update', handleGameStateUpdate);
      socket.off('cards-dropped', handleCardsDropped);
      socket.off('card-picked', handleCardPicked);
      socket.off('declared', handleDeclared);
      socket.off('error', handleError);
    };
  }, [socket, playerId, updateFromPublicState, updateFromPlayerState, setError]);

  const handleCardClick = (cardId: string) => {
    if (!isCurrentTurn || waitingForPick || gameState !== 'playing') return;
    
    setSelectedCards((prev) => {
      if (prev.includes(cardId)) {
        return prev.filter((id) => id !== cardId);
      } else {
        return [...prev, cardId];
      }
    });
  };

  const handleDropCards = () => {
    if (!socket || selectedCards.length === 0 || !isCurrentTurn || waitingForPick) return;

    const cardsToDrop = hand.filter((c) => selectedCards.includes(c.id));
    const validation = validateDrop(cardsToDrop);

    if (!validation.valid) {
      setError(validation.reason || 'Invalid card selection');
      setTimeout(() => setError(null), 3000);
      return;
    }

    socket.emit('drop-cards', { cardIds: selectedCards });
  };

  const handlePickCard = (fromDeck: boolean) => {
    if (!socket || !isCurrentTurn || !waitingForPick) return;
    
    if (!fromDeck) {
      // Picking from previous player's thrown cards
      if (lastThrownCards.length === 0) {
        setError('No cards available to pick');
        setTimeout(() => setError(null), 3000);
        return;
      }
      
      // Cannot pick your own thrown cards - these should be from previous player
      if (lastThrownPlayerId === playerId) {
        setError('Cannot pick your own thrown cards');
        setTimeout(() => setError(null), 3000);
        return;
      }
      
      // If only one card was thrown by previous player, pick it automatically
      if (lastThrownCards.length === 1) {
        socket.emit('pick-card', { fromDeck: false });
        setSelectedCardToPick(null);
        return;
      }
      
      // Multiple cards thrown by previous player - require selection
      if (!selectedCardToPick) {
        setError('Please select a card to pick');
        setTimeout(() => setError(null), 3000);
        return;
      }
      
      socket.emit('pick-card', { fromDeck: false, cardId: selectedCardToPick });
      setSelectedCardToPick(null);
    } else {
      // Picking from deck
      socket.emit('pick-card', { fromDeck: true });
      setSelectedCardToPick(null);
    }
  };
  
  const handleSelectCardToPick = (cardId: string) => {
    if (!waitingForPick || !isCurrentTurn) return;
    setSelectedCardToPick(cardId === selectedCardToPick ? null : cardId);
  };

  const handleDeclare = () => {
    if (!socket || !isCurrentTurn || waitingForPick) return;
    
    if (!canDeclare(hand)) {
      setError('Hand value must be ≤ 5 to declare');
      setTimeout(() => setError(null), 3000);
      return;
    }

    socket.emit('declare');
  };

  const handleSetReady = () => {
    if (!socket) return;
    const currentPlayer = players.find((p) => p.id === playerId);
    socket.emit('set-ready', { ready: !currentPlayer?.isReady });
  };

  const handValue = calculateHandValue(hand);
  const canDeclareHand = canDeclare(hand);
  const currentPlayer = players.find((p) => p.id === playerId);
  const selfPlayerIndex = players.findIndex((p) => p.id === playerId);

  // Calculate player positions around the table
  const getPlayerPosition = (index: number, total: number) => {
    if (total === 2) {
      // Opposite sides
      const angles = [90, 270]; // Top and bottom
      return angles[index];
    } else if (total === 3) {
      // Triangle (top, bottom-left, bottom-right)
      const angles = [90, 210, 330];
      return angles[index];
    } else if (total === 4) {
      // Square (top, right, bottom, left)
      const angles = [90, 0, 270, 180];
      return angles[index];
    } else {
      // 5 players - pentagon
      const angles = [90, 18, 306, 234, 162];
      return angles[index];
    }
  };

  if (gameState === 'waiting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <motion.div
          className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h2 className="text-2xl font-bold text-center mb-6">Waiting Room</h2>
          <div className="mb-6">
            <p className="text-center text-gray-600 mb-4">Room Code: <span className="font-bold text-2xl text-blue-600">{roomId}</span></p>
            <div className="space-y-3">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className={`p-4 rounded-lg border-2 ${
                    player.id === playerId
                      ? 'bg-blue-50 border-blue-400'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">
                      {player.name} {player.id === playerId && '(You)'}
                    </span>
                    <div className="flex items-center gap-2">
                      {player.isReady ? (
                        <span className="text-green-600 font-semibold">Ready</span>
                      ) : (
                        <span className="text-gray-400">Not Ready</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleSetReady}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                currentPlayer?.isReady
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {currentPlayer?.isReady ? 'Not Ready' : 'Ready'}
            </button>
            <button
              onClick={() => setShowScoreboard(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Scoreboard
            </button>
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
            {players.length} / 5 players • Waiting for all players to be ready...
          </p>
        </motion.div>
        <Scoreboard isOpen={showScoreboard} onClose={() => setShowScoreboard(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Room: {roomId}</h1>
            <p className="text-sm text-gray-600">Round {roundNumber}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowScoreboard(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Scoreboard
            </button>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="relative w-full flex justify-center" style={{ minHeight: '500px' }}>
          {/* Circular Table - Smaller size for laptop screens */}
          <div className="relative" style={{ width: '500px', height: '500px' }}>
            {/* Table Circle */}
            <div 
              className="absolute inset-0 rounded-full shadow-2xl border-6"
              style={{
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 50%, #166534 100%)',
                borderColor: '#14532d',
              }}
            />
            
            {/* Center Area - Thrown Cards and Info */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              {/* Turn Timer */}
              {isCurrentTurn && (
                <div className="mb-2">
                  <TurnTimer 
                    startTime={turnStartTime} 
                    duration={30000} 
                    isCurrentTurn={isCurrentTurn} 
                  />
                </div>
              )}
              
              {/* Last Thrown Cards - Show in center when available (from previous player) */}
              {canPickFromThrown && (
                <div className="mb-2">
                  <p className="text-xs text-white mb-1 text-center font-semibold">
                    Last thrown by {players.find(p => p.id === lastThrownPlayerId)?.name || 'Previous Player'}
                  </p>
                  <div className="flex gap-1 justify-center flex-wrap">
                    {lastThrownCards.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => showCardSelection && handleSelectCardToPick(card.id)}
                        className={`transition-all ${
                          showCardSelection 
                            ? 'cursor-pointer hover:scale-110' 
                            : ''
                        } ${
                          selectedCardToPick === card.id && showCardSelection
                            ? 'ring-4 ring-yellow-400 ring-offset-2 scale-110'
                            : ''
                        }`}
                      >
                        <Card
                          card={card}
                          size={showCardSelection ? "lg" : "md"}
                          selected={selectedCardToPick === card.id && showCardSelection}
                        />
                      </div>
                    ))}
                  </div>
                  {showCardSelection && (
                    <p className="text-xs text-white mt-1 text-center">
                      Click a card to select it, then click "Pick Last Thrown"
                    </p>
                  )}
                  {waitingForPick && lastThrownCards.length === 1 && (
                    <p className="text-xs text-white mt-1 text-center">
                      Click "Pick Last Thrown" to pick this card
                    </p>
                  )}
                </div>
              )}
              
              {/* Deck Count */}
              <div className="mt-1">
                <p className="text-white text-xs font-semibold">
                  Deck: {deckCount} cards
                </p>
              </div>
            </div>

            {/* Player Seats - Positioned around the table */}
            {players.map((player, index) => {
              const angle = getPlayerPosition(index, players.length);
              const radius = 200; // Distance from center (reduced for smaller table)
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;
              
              return (
                <div
                  key={player.id}
                  className="absolute"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  }}
                >
                  <PlayerSeat
                    player={player}
                    isCurrentTurn={currentTurn === player.id}
                    isSelf={player.id === playerId}
                    position={index}
                    totalPlayers={players.length}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Player Hand - Bottom Section */}
        {gameState === 'playing' && (
          <motion.div
            className="bg-white rounded-2xl shadow-xl p-6 mt-8"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Your Hand</h3>
                <p className="text-sm text-gray-600">
                  Value: <span className="font-bold">{handValue}</span> points
                </p>
              </div>
              {isCurrentTurn && (
                <div className="text-sm text-yellow-600 font-semibold animate-pulse">
                  Your Turn
                </div>
              )}
            </div>

            {/* Cards */}
            <div className="flex flex-wrap gap-3 justify-center mb-6">
              {hand.map((card) => (
                <Card
                  key={card.id}
                  card={card}
                  selected={selectedCards.includes(card.id)}
                  onClick={() => handleCardClick(card.id)}
                  disabled={!isCurrentTurn || waitingForPick}
                />
              ))}
            </div>

            {/* Action Buttons */}
            {isCurrentTurn && (
              <div className="flex flex-wrap gap-3 justify-center">
                {!waitingForPick ? (
                  <>
                    <button
                      onClick={handleDropCards}
                      disabled={selectedCards.length === 0}
                      className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                        selectedCards.length > 0
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Drop {selectedCards.length > 0 ? `(${selectedCards.length})` : ''}
                    </button>
                    <button
                      onClick={handleDeclare}
                      disabled={!canDeclareHand}
                      className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                        canDeclareHand
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 shadow-lg'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      🎯 Dhumbal
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handlePickCard(true)}
                      disabled={deckCount === 0}
                      className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                        deckCount > 0
                          ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Pick from Deck
                    </button>
                    {canPickFromThrown && (
                      <button
                        onClick={() => handlePickCard(false)}
                        disabled={showCardSelection && !selectedCardToPick}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                          showCardSelection && !selectedCardToPick
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg'
                        }`}
                      >
                        {lastThrownCards.length === 1
                          ? 'Pick Last Thrown'
                          : selectedCardToPick
                          ? 'Pick Selected Card'
                          : 'Pick Last Thrown'}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {!isCurrentTurn && gameState === 'playing' && (
              <div className="text-center text-gray-500 py-4">
                Waiting for your turn...
              </div>
            )}
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
          >
            {error}
          </motion.div>
        )}
      </div>

      <Scoreboard isOpen={showScoreboard} onClose={() => setShowScoreboard(false)} />
    </div>
  );
}
