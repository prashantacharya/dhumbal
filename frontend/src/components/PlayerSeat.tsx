/**
 * Player Seat Component
 * Shows player info in circular table layout
 */

'use client';

import { motion } from 'framer-motion';
import { Player } from '@/store/gameStore';

interface PlayerSeatProps {
  player: Player;
  isCurrentTurn: boolean;
  isSelf: boolean;
  position: number; // 0-4 for positioning around circle
  totalPlayers: number;
}

export default function PlayerSeat({ 
  player, 
  isCurrentTurn, 
  isSelf,
  position,
  totalPlayers 
}: PlayerSeatProps) {
  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className={`
          w-20 h-20 rounded-full 
          bg-gradient-to-br from-blue-400 to-blue-600 
          flex items-center justify-center 
          text-white font-bold text-lg
          shadow-lg border-4
          ${isCurrentTurn ? 'border-yellow-400 ring-4 ring-yellow-300' : 'border-white'}
          ${isSelf ? 'ring-2 ring-green-400' : ''}
        `}
      >
        {player.name.charAt(0).toUpperCase()}
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold text-gray-800">
          {isSelf ? 'You' : player.name}
        </div>
        <div className="text-xs text-gray-600">
          {player.handCount} cards
        </div>
        <div className="text-xs font-bold text-blue-600">
          Score: {player.totalScore}
        </div>
        {player.isReady && (
          <div className="text-xs text-green-600 font-semibold">Ready</div>
        )}
      </div>
      {isCurrentTurn && (
        <motion.div
          className="w-3 h-3 bg-yellow-400 rounded-full"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      )}
    </motion.div>
  );
}
