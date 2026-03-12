/**
 * Main Page - Lobby Entry Point
 */

'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import Lobby from '@/components/Lobby';
import GameBoard from '@/components/GameBoard';
import { useGameStore } from '@/store/gameStore';

export default function Home() {
  const { socket, connected } = useSocket();
  const { roomId } = useGameStore();
  const [inGame, setInGame] = useState(false);

  useEffect(() => {
    if (roomId) {
      setInGame(true);
    }
  }, [roomId]);

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to server...</p>
        </div>
      </div>
    );
  }

  return (
    <main>
      {inGame ? (
        <GameBoard socket={socket} />
      ) : (
        <Lobby socket={socket} onJoinGame={() => setInGame(true)} />
      )}
    </main>
  );
}
