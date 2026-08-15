"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import {
  ArrowLeft, Search, Users, Trophy, Swords, Shield,
  ChevronRight, Loader2, UserPlus, Zap, Send, X, Star
} from 'lucide-react';

export default function RequestPage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [challengeSent, setChallengeSent] = useState(false);
  const searchTimeout = useRef(null);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/players/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.players || []);
        }
      } catch (err) {
        console.error('[Request] Search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery]);

  const handleChallenge = (player) => {
    setSelectedPlayer(player);
  };

  /**
   * Real-time challenges need a socket layer that does not exist yet, so the
   * challenge resolves into a match against that player's AI stand-in — which
   * at least honours their rating rather than dropping the player nowhere.
   */
  const sendChallenge = () => {
    if (!selectedPlayer) return;
    setChallengeSent(true);

    const difficulty =
      selectedPlayer.elo_rating >= 2000 ? 'nightmare' :
      selectedPlayer.elo_rating >= 1700 ? 'elite' :
      selectedPlayer.elo_rating >= 1300 ? 'veteran' : 'rookie';

    setTimeout(() => {
      sessionStorage.setItem('matchConfig', JSON.stringify({
        gameMode: 'deathmatch',
        teamSize: '1v1',
        matchTime: 120,
        vsComputer: true,
        botDifficulty: difficulty,
        opponent: {
          isBot: true,
          difficulty,
          username: selectedPlayer.username,
          rank_title: selectedPlayer.rank_title,
          elo_rating: selectedPlayer.elo_rating,
          wins: selectedPlayer.wins,
          losses: selectedPlayer.losses,
          languages: ['JavaScript'],
          specialty: 'Challenger',
          location: 'Arena',
          killStreak: selectedPlayer.kill_streak || 0,
          avgResponseTime: 20,
        },
      }));
      router.push('/combat');
    }, 1400);
  };

  const getRankColor = (title) => {
    const colors = {
      'Grandmaster': 'text-red-400 border-red-500/30 bg-red-500/10',
      'Master': 'text-purple-400 border-purple-500/30 bg-purple-500/10',
      'Diamond': 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
      'Platinum': 'text-blue-400 border-blue-500/30 bg-blue-500/10',
      'Gold': 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
      'Silver': 'text-gray-300 border-gray-400/30 bg-gray-400/10',
      'Bronze': 'text-amber-600 border-amber-600/30 bg-amber-600/10',
      'Recruit': 'text-gray-500 border-gray-600/30 bg-gray-600/10',
    };
    return colors[title] || 'text-gray-400 border-gray-500/30 bg-gray-500/10';
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: 'linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-purple-500/30 bg-black/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <motion.button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-purple-500/10 rounded-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="w-5 h-5 text-purple-400" />
          </motion.button>
          <span className="text-purple-400 text-xl font-bold font-mono flex items-center gap-2">
            <Swords className="w-6 h-6" />
            CHALLENGE
          </span>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search players by username..."
              className="w-full bg-gray-900/80 border-2 border-purple-500/30 focus:border-purple-500 rounded-xl pl-12 pr-4 py-4 text-white font-mono focus:outline-none transition-colors"
            />
            {searching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400 animate-spin" />
            )}
          </div>
          <p className="text-gray-600 font-mono text-xs mt-2">Type at least 2 characters to search</p>
        </div>

        {/* Search Results */}
        <div className="space-y-3 mb-8">
          <AnimatePresence>
            {searchResults.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedPlayer?.id === player.id
                    ? 'bg-purple-500/15 border-purple-500/50'
                    : 'bg-gray-900/50 border-gray-800 hover:border-purple-500/30 hover:bg-gray-800/50'
                }`}
                onClick={() => handleChallenge(player)}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {player.avatar_url ? (
                    <img src={player.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 font-mono font-bold text-lg">
                      {(player.username || '?')[0]?.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-mono font-bold">@{player.username}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border font-mono ${getRankColor(player.rank_title)}`}>
                      {player.rank_title}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 font-mono">
                    <span>ELO: <span className="text-yellow-400">{player.elo_rating}</span></span>
                    <span>W/L: <span className="text-green-400">{player.wins}</span>/<span className="text-red-400">{player.losses}</span></span>
                    <span>WR: <span className={player.winRate >= 50 ? 'text-green-400' : 'text-red-400'}>{player.winRate}%</span></span>
                  </div>
                </div>

                {/* Challenge Button */}
                <motion.button
                  onClick={(e) => { e.stopPropagation(); handleChallenge(player); }}
                  className="p-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Swords className="w-5 h-5" />
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>

          {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 font-mono text-sm">No players found matching "{searchQuery}"</p>
            </div>
          )}
        </div>

        {/* Selected Player Challenge Panel */}
        <AnimatePresence>
          {selectedPlayer && !challengeSent && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t-2 border-purple-500/50 p-6 z-20"
            >
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gray-800 border-2 border-purple-500/50 overflow-hidden">
                    {selectedPlayer.avatar_url ? (
                      <img src={selectedPlayer.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-purple-400 font-mono font-bold text-xl">
                        {(selectedPlayer.username || '?')[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-white font-mono font-bold text-lg">Challenge @{selectedPlayer.username}?</div>
                    <div className="text-gray-400 text-sm font-mono">
                      {selectedPlayer.rank_title} • ELO {selectedPlayer.elo_rating}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedPlayer(null)}
                    className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <motion.button
                    onClick={sendChallenge}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl font-mono transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Send className="w-5 h-5" />
                    SEND CHALLENGE
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Challenge Sent Confirmation */}
        <AnimatePresence>
          {challengeSent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ y: 30 }}
                animate={{ y: 0 }}
                className="bg-gray-900 border-2 border-purple-500/50 rounded-2xl p-8 text-center max-w-sm"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                  transition={{ type: 'spring', delay: 0.2 }}
                >
                  <Swords className="w-16 h-16 text-purple-400 mx-auto" />
                </motion.div>
                <h3 className="text-purple-400 font-mono font-bold text-xl mt-4">CHALLENGE ACCEPTED!</h3>
                <p className="text-gray-400 font-mono text-sm mt-2">
                  Dropping you into the arena…
                </p>
                <Loader2 className="w-6 h-6 animate-spin text-purple-400 mx-auto mt-4" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions */}
        {searchQuery.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <h3 className="text-gray-400 font-mono text-sm font-bold flex items-center gap-2">
              <Zap className="w-4 h-4" /> QUICK ACTIONS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.button
                onClick={() => router.push('/matchmaking')}
                className="p-6 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-green-500/30 transition-all text-left"
                whileHover={{ scale: 1.02 }}
              >
                <Zap className="w-8 h-8 text-green-400 mb-3" />
                <div className="text-white font-mono font-bold mb-1">Quick Match</div>
                <div className="text-gray-500 text-xs font-mono">Find a random opponent</div>
              </motion.button>
              <motion.button
                onClick={() => router.push('/leaderboard')}
                className="p-6 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-yellow-500/30 transition-all text-left"
                whileHover={{ scale: 1.02 }}
              >
                <Trophy className="w-8 h-8 text-yellow-400 mb-3" />
                <div className="text-white font-mono font-bold mb-1">Leaderboard</div>
                <div className="text-gray-500 text-xs font-mono">See top players and challenge them</div>
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
