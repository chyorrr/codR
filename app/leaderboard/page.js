"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft, Trophy, Medal, Crown, Flame, Users, Loader2, Info } from 'lucide-react';

import { getLocalProfile } from '../lib/gameStore';

const PERIODS = [
  { id: 'all', label: 'ALL TIME' },
  { id: 'weekly', label: 'WEEKLY' },
  { id: 'daily', label: 'TODAY' },
];

export default function LeaderboardPage() {
  const router = useRouter();
  const { user } = useUser();

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [source, setSource] = useState('database');
  const [me, setMe] = useState(null);

  useEffect(() => {
    setMe(getLocalProfile());
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchLeaderboard = async (isInitial) => {
      if (isInitial) setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?period=${period}&limit=50`);
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          setPlayers(data.players || []);
          setSource(data.source || 'database');
        }
      } catch {
        /* keep whatever is already on screen */
      } finally {
        if (isInitial && !cancelled) setLoading(false);
      }
    };

    fetchLeaderboard(true);
    const interval = setInterval(() => fetchLeaderboard(false), 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [period]);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-gray-500 font-mono font-bold">{rank}</span>;
  };

  const getRankColor = (title) => ({
    Grandmaster: 'text-red-400 border-red-500/30',
    Master: 'text-purple-400 border-purple-500/30',
    Diamond: 'text-cyan-400 border-cyan-500/30',
    Platinum: 'text-blue-400 border-blue-500/30',
    Gold: 'text-yellow-400 border-yellow-500/30',
    Silver: 'text-gray-300 border-gray-400/30',
    Bronze: 'text-amber-600 border-amber-600/30',
    Recruit: 'text-gray-500 border-gray-600/30',
  }[title] || 'text-gray-400 border-gray-500/30');

  const getRowBg = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/30';
    if (rank === 2) return 'bg-gradient-to-r from-gray-400/10 to-transparent border-gray-400/30';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600/10 to-transparent border-amber-600/30';
    return 'bg-gray-900/30 border-gray-700/30 hover:bg-gray-800/50';
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="w-full h-full" style={{
          backgroundImage: 'linear-gradient(rgba(234,179,8,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(234,179,8,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-yellow-500/30 bg-black/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-yellow-500/10 rounded-lg transition-colors shrink-0"
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              aria-label="Back to home"
            >
              <ArrowLeft className="w-5 h-5 text-yellow-400" />
            </motion.button>
            <h1 className="text-yellow-400 text-xl font-bold flex items-center gap-2 font-mono">
              <Trophy className="w-6 h-6" /> LEADERBOARD
            </h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-green-400 font-mono">LIVE</span>
            </div>
          </div>

          <div className="flex gap-2">
            {PERIODS.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setPeriod(tab.id)}
                className={`px-3 sm:px-4 py-2 font-mono text-xs rounded-lg border transition-all ${
                  period === tab.id
                    ? 'bg-yellow-500/20 border-yellow-500/60 text-yellow-400'
                    : 'border-gray-700 text-gray-500 hover:bg-gray-800'
                }`}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                aria-pressed={period === tab.id}
              >
                {tab.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Your standing — always shown, even offline */}
        {me && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-cyan-500/40 flex items-center justify-center shrink-0 overflow-hidden">
                {user?.imageUrl
                  ? <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                  : <span className="text-cyan-400 font-mono font-bold">{(user?.username || me.username || '?')[0]?.toUpperCase()}</span>}
              </div>
              <div className="min-w-0">
                <div className="font-mono font-bold text-white text-sm truncate">
                  {user?.username || me.username} <span className="text-cyan-400/60">(you)</span>
                </div>
                <div className="text-xs font-mono text-gray-500">
                  {me.wins}W / {me.losses}L · {me.rank_title}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6 font-mono text-sm">
              <div className="text-right">
                <div className="text-[10px] text-gray-500">ELO</div>
                <div className="text-yellow-400 font-bold">{me.elo_rating}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-gray-500">STREAK</div>
                <div className="text-orange-400 font-bold">{me.kill_streak}</div>
              </div>
            </div>
          </motion.div>
        )}

        {source === 'roster' && !loading && (
          <div className="mb-6 flex items-start gap-2 text-xs font-mono text-gray-500 bg-gray-900/40 border border-gray-800 rounded-lg p-3">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Showing the standing arena roster — the ranked database is unreachable, so global scores are not syncing right now.
              Your own progress above is saved on this device.
            </span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-yellow-400" />
            <span className="text-yellow-400 font-mono text-sm animate-pulse">Loading rankings…</span>
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-gray-400 font-mono text-xl mb-2">NO COMBATANTS YET</h2>
            <p className="text-gray-600 font-mono text-sm">Be the first to enter the arena and claim the top spot.</p>
            <motion.button
              onClick={() => router.push('/arsenal')}
              className="mt-6 bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 px-8 rounded-xl transition-colors font-mono"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
              ENTER ARENA
            </motion.button>
          </div>
        ) : (
          <>
            {/* Desktop header row */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 text-xs font-mono text-gray-500 uppercase tracking-wider border-b border-gray-800">
              <div className="col-span-1">RANK</div>
              <div className="col-span-4">PLAYER</div>
              <div className="col-span-2 text-center">ELO</div>
              <div className="col-span-2 text-center">W / L</div>
              <div className="col-span-1 text-center">WR</div>
              <div className="col-span-2 text-center">STREAK</div>
            </div>

            <div className="space-y-2 mt-2">
              <AnimatePresence>
                {players.map((player, i) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.4) }}
                    className={`grid grid-cols-2 md:grid-cols-12 gap-2 md:gap-4 items-center px-4 py-4 rounded-xl border transition-all ${getRowBg(player.rank)}`}
                  >
                    <div className="md:col-span-1 flex items-center md:justify-center order-1">
                      {getRankIcon(player.rank)}
                    </div>

                    <div className="md:col-span-4 flex items-center gap-3 order-3 md:order-2 col-span-2">
                      <div className="w-9 h-9 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                        {player.avatar_url
                          ? <img src={player.avatar_url} alt="" className="w-full h-full object-cover" />
                          : <span className="text-gray-400 font-mono text-sm font-bold">{(player.username || '?')[0]?.toUpperCase()}</span>}
                      </div>
                      <div className="min-w-0">
                        <div className="font-mono font-bold text-white text-sm truncate">
                          {player.username || 'Anonymous'}
                        </div>
                        <div className={`text-xs font-mono px-2 py-0.5 rounded border inline-block ${getRankColor(player.rank_title)}`}>
                          {player.rank_title || 'Recruit'}
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 text-right md:text-center order-2 md:order-3">
                      <span className="md:hidden text-[10px] text-gray-500 font-mono mr-1">ELO</span>
                      <span className="text-yellow-400 font-mono font-bold text-lg">{player.elo_rating}</span>
                    </div>

                    <div className="md:col-span-2 md:text-center font-mono text-sm order-4">
                      <span className="text-green-400">{player.wins}</span>
                      <span className="text-gray-600 mx-1">/</span>
                      <span className="text-red-400">{player.losses}</span>
                    </div>

                    <div className="md:col-span-1 text-right md:text-center order-5">
                      <span className={`font-mono font-bold text-sm ${
                        player.winRate >= 60 ? 'text-green-400' : player.winRate >= 40 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {player.winRate}%
                      </span>
                    </div>

                    <div className="md:col-span-2 flex items-center md:justify-center gap-1 order-6 col-span-2">
                      {player.kill_streak > 0 && <Flame className="w-4 h-4 text-orange-400" />}
                      <span className={`font-mono font-bold text-sm ${
                        player.kill_streak >= 5 ? 'text-orange-400' : player.kill_streak >= 3 ? 'text-yellow-400' : 'text-gray-400'
                      }`}>
                        {player.kill_streak}
                      </span>
                      {player.best_streak > 0 && (
                        <span className="text-gray-600 text-xs font-mono">(best {player.best_streak})</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
