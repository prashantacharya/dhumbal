/**
 * Turn Timer Component
 * Shows countdown for current player's turn
 */

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TurnTimerProps {
  startTime: number | null;
  duration: number; // in milliseconds
  isCurrentTurn: boolean;
}

export default function TurnTimer({ startTime, duration, isCurrentTurn }: TurnTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (!startTime || !isCurrentTurn) {
      setTimeLeft(duration);
      return;
    }

    const updateTimer = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);

    return () => clearInterval(interval);
  }, [startTime, duration, isCurrentTurn]);

  const seconds = Math.ceil(timeLeft / 1000);
  const percentage = (timeLeft / duration) * 100;
  const isWarning = seconds <= 10;
  const isCritical = seconds <= 5;

  if (!isCurrentTurn || !startTime) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="transform -rotate-90 w-20 h-20">
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-gray-200"
          />
          <motion.circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={`${2 * Math.PI * 36}`}
            strokeDashoffset={`${2 * Math.PI * 36 * (1 - percentage / 100)}`}
            className={
              isCritical
                ? 'text-red-500'
                : isWarning
                ? 'text-yellow-500'
                : 'text-green-500'
            }
            initial={{ strokeDashoffset: 2 * Math.PI * 36 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 36 * (1 - percentage / 100) }}
            transition={{ duration: 0.1 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-lg font-bold ${
              isCritical
                ? 'text-red-500'
                : isWarning
                ? 'text-yellow-500'
                : 'text-gray-700'
            }`}
          >
            {seconds}
          </span>
        </div>
      </div>
      {isWarning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ repeat: Infinity, duration: 0.5 }}
          className="text-xs text-red-500 font-semibold"
        >
          Time running out!
        </motion.div>
      )}
    </div>
  );
}
