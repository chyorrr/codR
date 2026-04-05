"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, SignInButton } from '@clerk/nextjs';
import {
  ArrowLeft, User, Trophy, Swords, Target, Shield, Star,
  Flame, TrendingUp, Edit3, Save, X, Loader2, Lock,
  Zap, Award, Clock, BarChart3
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const [profile, setProfile] = useState(null);
  const [weapons, setWeapons] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoaded || !isSignedIn) return;
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
          setWeapons(data.weapons || []);
          setMatches(data.recentMatches || []);
          setEditUsername(data.profile?.username || '');
          setEditBio(data.profile?.bio || '');
        }
      } catch (err) {
        console.error('[Profile] Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [authLoaded, isSignedIn]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: editUsername, bio: editBio }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data.profile);
        setEditing(false);
      } else {
        setError(data.error || 'Failed to save');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getRankColor = (title) => {
    const colors = {
      'Grandmaster': 'from-red-500 to-orange-500',
      'Master': 'from-purple-500 to-pink-500',
      'Diamond': 'from-cyan-500 to-blue-500',
      'Platinum': 'from-blue-400 to-blue-600',
      'Gold': 'from-yellow-400 to-amber-500',
      'Silver': 'from-gray-300 to-gray-500',
      'Bronze': 'from-amber-600 to-amber-800',
      'Recruit': 'from-gray-500 to-gray-700',
    };
    return colors[title] || 'from-gray-500 to-gray-700';
  };

  if (!authLoaded) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6">
        <Lock className="w-16 h-16 text-gray-600" />
        <h2 className="text-gray-400 font-mono text-xl">AUTHENTICATION REQUIRED</h2>
        <SignInButton mode="modal">
          <motion.button
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-8 rounded-xl font-mono"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            SIGN IN
          </motion.button>
        </SignInButton>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
        <span className="text-cyan-400 font-mono text-sm">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-cyan-500/30 bg-black/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <motion.button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-cyan-500/10 rounded-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="w-5 h-5 text-cyan-400" />
          </motion.button>
          <span className="text-cyan-400 text-xl font-bold font-mono flex items-center gap-2">
            <User className="w-6 h-6" />
            PROFILE
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-cyan-500/30 rounded-xl p-8"
        >
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gray-800 border-2 border-cyan-500/50 overflow-hidden">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-cyan-400 text-3xl font-bold font-mono">
                    {(profile?.username || '?')[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className={`absolute -bottom-2 -right-2 px-2 py-1 rounded-lg text-xs font-mono font-bold bg-gradient-to-r ${getRankColor(profile?.rank_title)} text-white`}>
                {profile?.rank_title || 'Recruit'}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              {editing ? (
                <div className="space-y-3">
                  <input
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full bg-gray-800 border border-cyan-500/30 rounded-lg px-4 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                  <textarea
                    value={editBio}
                    onChange={e => setEditBio(e.target.value)}
                    placeholder="Write a bio..."
                    rows={2}
                    className="w-full bg-gray-800 border border-cyan-500/30 rounded-lg px-4 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none resize-none"
                  />
                  {error && <p className="text-red-400 text-sm font-mono">{error}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg text-sm font-mono"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      SAVE
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-mono"
                    >
                      <X className="w-4 h-4" /> CANCEL
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-bold text-white font-mono">
                      @{profile?.username || 'Anonymous'}
                    </h2>
                    <button
                      onClick={() => setEditing(true)}
                      className="p-1 hover:bg-gray-700 rounded text-gray-500 hover:text-white transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm">{profile?.bio || 'No bio set'}</p>
                  <p className="text-gray-600 text-xs font-mono mt-1">
                    Member since {new Date(profile?.created_at).toLocaleDateString()}
                  </p>
                </>
              )}
            </div>

            {/* ELO Display */}
            <div className="text-right">
              <div className="text-xs text-gray-500 font-mono mb-1">ELO RATING</div>
              <div className="text-4xl font-bold text-yellow-400 font-mono">{profile?.elo_rating || 1200}</div>
              <div className="text-xs text-gray-500 font-mono mt-1">{profile?.xp || 0} XP</div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'MATCHES', value: profile?.total_matches || 0, icon: Swords, color: 'text-cyan-400', border: 'border-cyan-500/30' },
            { label: 'WINS', value: profile?.wins || 0, icon: Trophy, color: 'text-green-400', border: 'border-green-500/30' },
            { label: 'LOSSES', value: profile?.losses || 0, icon: Target, color: 'text-red-400', border: 'border-red-500/30' },
            { label: 'BEST STREAK', value: profile?.best_streak || 0, icon: Flame, color: 'text-orange-400', border: 'border-orange-500/30' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`bg-gray-900/50 border ${stat.border} rounded-xl p-4 text-center`}
              >
                <Icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                <div className="text-2xl font-bold text-white font-mono">{stat.value}</div>
                <div className="text-xs text-gray-500 font-mono">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Equipped Weapons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-6"
        >
          <h3 className="text-lg font-bold text-cyan-400 font-mono mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            EQUIPPED WEAPONS
          </h3>
          {weapons.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 font-mono text-sm mb-3">No weapons equipped yet</p>
              <button
                onClick={() => router.push('/arsenal')}
                className="text-cyan-400 hover:text-cyan-300 font-mono text-sm underline"
              >
                Visit Arsenal →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {weapons.map(uw => (
                <div key={uw.id} className="bg-black/30 border border-gray-700 rounded-lg p-4 flex items-center gap-3">
                  <Zap className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-white font-mono font-bold text-sm">{uw.weapons?.name || 'Unknown'}</div>
                    <div className="text-gray-500 text-xs font-mono">
                      {uw.is_equipped ? '✅ Equipped' : 'In inventory'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Matches */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-6"
        >
          <h3 className="text-lg font-bold text-cyan-400 font-mono mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            RECENT MATCHES
          </h3>
          {matches.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 font-mono text-sm mb-3">No matches played yet</p>
              <button
                onClick={() => router.push('/arsenal')}
                className="text-cyan-400 hover:text-cyan-300 font-mono text-sm underline"
              >
                Start your first battle →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {matches.map((match, i) => {
                const won = match.winner_id === user?.id;
                return (
                  <div
                    key={match.id || i}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      won ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-mono font-bold text-sm ${won ? 'text-green-400' : 'text-red-400'}`}>
                        {won ? 'WIN' : 'LOSS'}
                      </span>
                      <span className="text-gray-500 text-xs font-mono">
                        {match.game_mode || 'deathmatch'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className={won ? 'text-green-400' : 'text-red-400'}>
                        {won ? `+${match.winner_elo_delta}` : match.loser_elo_delta} ELO
                      </span>
                      <span className="text-gray-600">
                        {new Date(match.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
