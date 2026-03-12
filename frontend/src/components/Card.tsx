/**
 * Card Component
 * Displays a playing card with animations
 */

'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Card as CardType, getCardImagePath } from '@/utils/gameLogic';

interface CardProps {
  card: CardType | null;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  faceUp?: boolean;
}

export default function Card({ 
  card, 
  selected = false, 
  onClick, 
  disabled = false,
  size = 'md',
  faceUp = true 
}: CardProps) {
  const sizeClasses = {
    sm: { width: 60, height: 84, className: 'w-[60px] h-[84px]' },
    md: { width: 80, height: 112, className: 'w-[80px] h-[112px]' },
    lg: { width: 100, height: 140, className: 'w-[100px] h-[140px]' },
  };

  const dimensions = sizeClasses[size];
  const imagePath = getCardImagePath(card, faceUp);

  return (
    <motion.div
      className={`
        ${dimensions.className}
        relative
        rounded-lg 
        shadow-lg 
        ${selected ? 'ring-4 ring-yellow-400 ring-offset-2 z-10' : 'border-2 border-gray-300'} 
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        overflow-hidden
        transition-all
        bg-white
      `}
      whileHover={!disabled ? { scale: 1.1, y: -8 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={disabled ? undefined : onClick}
      animate={selected ? { y: -10 } : { y: 0 }}
    >
      <Image
        src={imagePath}
        alt={card ? `${card.rank} of ${card.suit}` : faceUp ? 'Card back' : 'Empty card'}
        width={dimensions.width}
        height={dimensions.height}
        className="object-contain w-full h-full"
        unoptimized
        priority={false}
      />
    </motion.div>
  );
}
