"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import {
  ArrowLeft, Code, Target, Loader2, Lock, Swords, ChevronRight, Play,
} from 'lucide-react';

import { WEAPON_CATALOG, TIERS, levelFromXp } from '../lib/weapons';
import { getLocalProfile } from '../lib/gameStore';
import sfx from '../lib/sfx';

const TIER_ORDER = ['all', 'basic', 'advanced', 'specialist', 'legendary'];

export default function ArsenalPage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const [weapons, setWeapons] = useState(WEAPON_CATALOG);
  const [loading, setLoading] = useState(true);
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  const [equipping, setEquipping] = useState(false);
  const [tier, setTier] = useState('all');
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [playerLevel, setPlayerLevel] = useState(0);

  const bootTimers = useRef([]);

  const runTerminalBoot = useCallback((weapon) => {
    bootTimers.current.forEach(clearTimeout);
    bootTimers.current = [];
    if (!weapon) return;

    setTerminalOutput([]);
    const lines = [
      `$ loading weapon "${weapon.name}"...`,
      `$ challenge: ${weapon.challenge_type || 'General'}`,
      `$ difficulty: ${weapon.difficulty || 'standard'}`,
      `$ dmg=${weapon.damage} spd=${weapon.speed} acc=${weapon.accuracy}`,
      `$ function: ${weapon.function_name || 'solve'}()`,
      `$ tests: ${weapon.test_cases?.length ?? 0} case(s)`,
      `$ WEAPON SYSTEM ONLINE ✓`,
    ];
    lines.forEach((line, i) => {
      bootTimers.current.push(setTimeout(() => setTerminalOutput((prev) => [...prev, line]), i * 160));
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      let list = WEAPON_CATALOG;
      try {
        const res = await fetch('/api/weapons');
        if (res.ok) {
          const data = await res.json();
          if (data.weapons?.length) list = data.weapons;
        }
      } catch {
        /* bundled catalog is a complete arsenal on its own */
      }
      if (cancelled) return;

      setWeapons(list);
      setPlayerLevel(levelFromXp(getLocalProfile().xp));
      setSelectedWeapon(list[0] || null);
      runTerminalBoot(list[0]);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
      bootTimers.current.forEach(clearTimeout);
    };
  }, [runTerminalBoot]);

  const handleSelectWeapon = (weapon) => {
    if (weapon.unlock_level > playerLevel) return;
    sfx.select();
    setSelectedWeapon(weapon);
    runTerminalBoot(weapon);
  };

  const handleEquipAndPlay = async () => {
    if (!selectedWeapon) return;
    sfx.alert();
    sessionStorage.setItem('selectedWeapon', JSON.stringify(selectedWeapon));

    if (isSignedIn) {
      setEquipping(true);
      try {
        await fetch('/api/weapons/equip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weaponId: selectedWeapon.id, equip: true }),
        });
      } catch {
        /* equipping is a convenience — the session choice already carries */
      }
      setEquipping(false);
    }

    router.push('/matchmaking');
  };

  const filteredWeapons = useMemo(
    () => (tier === 'all' ? weapons : weapons.filter((w) => w.tier === tier)),
    [weapons, tier]
  );

  const getDifficultyColor = (diff) => ({
    easy: 'text-green-400 border-green-500/30 bg-green-500/10',
    medium: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
    hard: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
    expert: 'text-red-400 border-red-500/30 bg-red-500/10',
  }[diff] || 'text-gray-400 border-gray-500/30 bg-gray-500/10');

  const StatBar = ({ value, max, color }) => (
    <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex-1">
      <motion.div
        className={`h-full ${color} rounded-full`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-green-400" />
        <span className="text-green-400 font-mono text-sm animate-pulse">Loading arsenal…</span>
      </div>
    );
  }

  const locked = selectedWeapon && selectedWeapon.unlock_level > playerLevel;

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="w-full h-full" style={{
          backgroundImage: 'linear-gradient(rgba(34,197,94,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.4) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-green-500/30 bg-black/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <motion.button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-green-500/10 rounded-lg transition-colors shrink-0"
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              aria-label="Back to home"
            >
              <ArrowLeft className="w-5 h-5 text-green-400" />
            </motion.button>
            <div className="font-mono truncate">
              <span className="text-green-400 text-xl font-bold">ARSENAL</span>
              <span className="text-green-500/60 ml-2 hidden sm:inline">// Weapon Selection v3.0</span>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-xs font-mono text-gray-500 hidden sm:inline">LVL {playerLevel}</span>
            <div className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-mono text-sm">{weapons.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Tier filter */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-8">
          {TIER_ORDER.map((t) => (
            <motion.button
              key={t}
              onClick={() => { setTier(t); sfx.select(); }}
              className={`px-4 py-2 font-mono text-sm rounded-lg border transition-all ${
                tier === t
                  ? 'bg-green-500/20 border-green-500/60 text-green-400'
                  : 'border-green-500/20 text-green-500/60 hover:bg-green-500/10'
              }`}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              aria-pressed={tier === t}
            >
              {t === 'all' ? 'ALL' : TIERS[t].label}
            </motion.button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Weapon list */}
          <div className="lg:col-span-1 space-y-3 lg:max-h-[70vh] overflow-y-auto lg:pr-2">
            <AnimatePresence mode="popLayout">
              {filteredWeapons.map((weapon, i) => {
                const isLocked = weapon.unlock_level > playerLevel;
                const isSelected = selectedWeapon?.id === weapon.id;
                return (
                  <motion.button
                    key={weapon.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: Math.min(i * 0.04, 0.3) }}
                    onClick={() => handleSelectWeapon(weapon)}
                    disabled={isLocked}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-green-500/15 border-green-500/60 shadow-lg shadow-green-500/10'
                        : isLocked
                          ? 'bg-gray-900/30 border-gray-800 opacity-50 cursor-not-allowed'
                          : 'bg-gray-900/50 border-gray-700/50 hover:bg-gray-800/50 hover:border-green-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <span className={`font-mono font-bold truncate flex items-center gap-2 ${isSelected ? 'text-green-400' : 'text-gray-300'}`}>
                        {isLocked && <Lock className="w-3.5 h-3.5 shrink-0" />}
                        {weapon.name}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded border font-mono shrink-0 ${getDifficultyColor(weapon.difficulty)}`}>
                        {(weapon.difficulty || 'easy').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 font-mono">
                      <span>DMG {weapon.damage}</span>
                      <span>SPD {weapon.speed}</span>
                      <span>ACC {weapon.accuracy}</span>
                    </div>
                    {isLocked && (
                      <div className="mt-2 text-[11px] font-mono text-orange-400/70">
                        Unlocks at level {weapon.unlock_level}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>

            {filteredWeapons.length === 0 && (
              <div className="text-center text-gray-500 font-mono py-8">No weapons in this tier</div>
            )}
          </div>

          {/* Detail */}
          <div className="lg:col-span-2 space-y-6">
            {selectedWeapon ? (
              <>
                <motion.div
                  key={selectedWeapon.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-green-500/40 rounded-xl p-6"
                >
                  <div className="flex items-start justify-between mb-6 gap-4">
                    <div className="min-w-0">
                      <h1 className="text-2xl sm:text-3xl font-bold text-green-400 font-mono mb-1 truncate">
                        {selectedWeapon.name}
                      </h1>
                      <p className="text-gray-400 text-sm">{selectedWeapon.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg border text-sm font-mono font-bold shrink-0 ${getDifficultyColor(selectedWeapon.difficulty)}`}>
                      {(selectedWeapon.difficulty || 'easy').toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3">
                      <span className="text-red-400 font-mono text-sm w-12">DMG</span>
                      <StatBar value={selectedWeapon.damage} max={60} color="bg-red-500" />
                      <span className="text-white font-mono text-sm w-8 text-right">{selectedWeapon.damage}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-blue-400 font-mono text-sm w-12">SPD</span>
                      <StatBar value={selectedWeapon.speed} max={100} color="bg-blue-500" />
                      <span className="text-white font-mono text-sm w-8 text-right">{selectedWeapon.speed}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-400 font-mono text-sm w-12">ACC</span>
                      <StatBar value={selectedWeapon.accuracy} max={100} color="bg-green-500" />
                      <span className="text-white font-mono text-sm w-8 text-right">{selectedWeapon.accuracy}</span>
                    </div>
                  </div>

                  {selectedWeapon.challenge_code && (
                    <div className="bg-black/50 border border-green-500/20 rounded-lg p-4">
                      <div className="text-cyan-400 font-mono text-xs mb-2 flex items-center gap-2">
                        <Code className="w-4 h-4" /> CHALLENGE PREVIEW
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{selectedWeapon.challenge_code}</p>
                      <div className="mt-2 text-xs text-gray-500 font-mono">
                        Function: <span className="text-cyan-400">{selectedWeapon.function_name}()</span>
                        {' | '}Tests: <span className="text-cyan-400">{selectedWeapon.test_cases?.length ?? '?'}</span>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Terminal */}
                <div className="bg-black/90 border border-green-500/30 rounded-xl overflow-hidden">
                  <div className="bg-green-900/20 px-4 py-2 border-b border-green-500/20 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                      <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                    </div>
                    <span className="text-green-400 font-mono text-xs">weapon-loader@codR:~$</span>
                  </div>
                  <div className="p-4 min-h-[150px] font-mono text-sm space-y-1">
                    {terminalOutput.map((line, i) => (
                      <motion.div
                        key={`${selectedWeapon.id}-${i}`}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        className={line.includes('ONLINE') ? 'text-green-400 font-bold' : 'text-green-500/80'}
                      >
                        {line}
                      </motion.div>
                    ))}
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }}
                      className="text-green-400 inline-block"
                    >█</motion.span>
                  </div>
                </div>

                <motion.button
                  onClick={handleEquipAndPlay}
                  disabled={equipping || locked}
                  className="w-full bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-700 hover:to-cyan-700 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl transition-all font-mono text-base sm:text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-green-500/30"
                  whileHover={{ scale: equipping || locked ? 1 : 1.02 }}
                  whileTap={{ scale: equipping || locked ? 1 : 0.98 }}
                >
                  {equipping
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> EQUIPPING…</>
                    : locked
                      ? <><Lock className="w-5 h-5" /> LOCKED — REACH LEVEL {selectedWeapon.unlock_level}</>
                      : <><Target className="w-5 h-5" /> EQUIP &amp; FIND MATCH <ChevronRight className="w-5 h-5" /></>}
                </motion.button>

                <button
                  onClick={() => {
                    sessionStorage.setItem('selectedWeapon', JSON.stringify(selectedWeapon));
                    router.push('/combat');
                  }}
                  disabled={locked}
                  className="w-full border border-green-500/30 hover:bg-green-500/10 disabled:opacity-40 disabled:cursor-not-allowed text-green-400 font-mono py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Play className="w-4 h-4" /> PRACTICE THIS CHALLENGE NOW
                </button>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500 font-mono">
                Select a weapon from the list
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
