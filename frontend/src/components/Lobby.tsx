/**
 * Lobby Component
 * Handles room creation and joining
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Socket } from 'socket.io-client';
import { useGameStore } from '@/store/gameStore';

interface LobbyProps {
  socket: Socket | null;
  onJoinGame: () => void;
}

export default function Lobby({ socket, onJoinGame }: LobbyProps) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [error, setError] = useState<string | null>(null);
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  
  const { setRoomId, setPlayerId, setPlayerName: setStorePlayerName, updateFromPlayerState, setError: setStoreError } = useGameStore();

  useEffect(() => {
    if (!socket) return;

    const handleRoomCreated = (data: { roomId: string; playerState: any }) => {
      setCreatedRoomId(data.roomId);
      setRoomId(data.roomId);
      setPlayerId(socket.id || null);
      setStorePlayerName(playerName);
      updateFromPlayerState(data.playerState);
      onJoinGame();
    };

    const handleRoomJoined = (data: { roomId: string; playerState: any }) => {
      setRoomId(data.roomId);
      setPlayerId(socket.id || null);
      setStorePlayerName(playerName);
      updateFromPlayerState(data.playerState);
      onJoinGame();
    };

    const handleError = (data: { message: string }) => {
      setError(data.message);
      setStoreError(data.message);
    };

    socket.on('room-created', handleRoomCreated);
    socket.on('room-joined', handleRoomJoined);
    socket.on('error', handleError);

    return () => {
      socket.off('room-created', handleRoomCreated);
      socket.off('room-joined', handleRoomJoined);
      socket.off('error', handleError);
    };
  }, [socket, playerName, setRoomId, setPlayerId, setStorePlayerName, updateFromPlayerState, onJoinGame, setStoreError]);

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!socket) {
      setError('Not connected to server');
      return;
    }
    setError(null);
    socket.emit('create-room', { playerName: playerName.trim() });
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter room code');
      return;
    }
    if (!socket) {
      setError('Not connected to server');
      return;
    }
    setError(null);
    socket.emit('join-room', { 
      roomId: roomCode.trim().toUpperCase(), 
      playerName: playerName.trim() 
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <motion.div
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Dhumbal
        </h1>
        <p className="text-center text-gray-600 mb-8">Nepalese Card Game</p>

        {createdRoomId && (
          <motion.div
            className="mb-6 p-4 bg-green-50 border-2 border-green-400 rounded-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p className="text-sm text-gray-700 mb-2">Room Created!</p>
            <p className="text-2xl font-bold text-green-600 text-center">
              {createdRoomId}
            </p>
            <p className="text-xs text-gray-600 text-center mt-2">
              Share this code with your friends
            </p>
          </motion.div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            maxLength={20}
          />
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setMode('create');
              setError(null);
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
              mode === 'create'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Create Room
          </button>
          <button
            onClick={() => {
              setMode('join');
              setError(null);
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
              mode === 'join'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Join Room
          </button>
        </div>

        {mode === 'join' && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter room code"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase text-gray-900 bg-white"
              maxLength={6}
            />
          </motion.div>
        )}

        {error && (
          <motion.div
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.div>
        )}

        <button
          onClick={mode === 'create' ? handleCreateRoom : handleJoinRoom}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
        >
          {mode === 'create' ? 'Create Room' : 'Join Room'}
        </button>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>2-5 players • Real-time multiplayer</p>
        </div>
      </motion.div>
    </div>
  );
}
