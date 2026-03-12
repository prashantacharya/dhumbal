/**
 * Scoreboard Component
 * Shows round-by-round history and current scores
 */

'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

interface ScoreboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Scoreboard({ isOpen, onClose }: ScoreboardProps) {
  const { players, roundHistory, roundNumber } = useGameStore();

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Scoreboard</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Current Scores */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Current Scores</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {players
                    .sort((a, b) => a.totalScore - b.totalScore)
                    .map((player, index) => (
                      <div
                        key={player.id}
                        className={`p-4 rounded-lg border-2 ${
                          index === 0
                            ? 'bg-yellow-50 border-yellow-400'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-900">
                            {player.name}
                          </span>
                          <span
                            className={`text-lg font-bold ${
                              index === 0 ? 'text-yellow-600' : 'text-gray-900'
                            }`}
                          >
                            {player.totalScore}
                          </span>
                        </div>
                        {index === 0 && (
                          <div className="text-xs text-yellow-600 mt-1">Leading</div>
                        )}
                      </div>
                    ))}
            </div>
          </div>

          {/* Round History */}
          {roundHistory.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Round History</h3>
              <div className="space-y-4">
                    {roundHistory
                      .slice()
                      .reverse()
                      .map((round) => (
                        <div
                          key={round.roundNumber}
                          className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                        >
                          <div className="font-semibold text-gray-900 mb-2">
                            Round {round.roundNumber}
                            {round.declarerId && (
                              <span className="text-sm text-blue-600 ml-2">
                                (Declared by{' '}
                                <span className="text-gray-900">{players.find((p) => p.id === round.declarerId)?.name || 'Unknown'}</span>
                                )
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                            {round.scores?.map((score: any) => (
                              <div
                                key={score.playerId}
                                className="flex justify-between"
                              >
                                <span className="text-gray-900">
                                  {score.playerName}:
                                </span>
                                <span
                                  className={`font-semibold ${
                                    score.score === 0
                                      ? 'text-green-600'
                                      : score.score >= 25
                                      ? 'text-red-600'
                                      : 'text-gray-700'
                                  }`}
                                >
                                  {score.score > 0 ? '+' : ''}
                                  {score.score} ({score.handValue})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
              </div>
            </div>
          )}

          {roundHistory.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No rounds completed yet
            </div>
          )}
        </motion.div>
      </motion.div>
    </>
  );
}
