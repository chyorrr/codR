"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import {
  ArrowLeft, Code, Shield, Zap, Target, Loader2, Check, Lock,
  Swords, ChevronRight, Terminal, Star
} from 'lucide-react';

export default function ArsenalPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [weapons, setWeapons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  const [equipping, setEquipping] = useState(false);
  const [category, setCategory] = useState('all');
  const [terminalOutput, setTerminalOutput] = useState([]);

  useEffect(() => {
    const fetchWeapons = async () => {
      try {
        const res = await fetch('/api/weapons');
        if (res.ok) {
          const data = await res.json();
          setWeapons(data.weapons || []);
          if (data.weapons && data.weapons.length > 0) {
            setSelectedWeapon(data.weapons[0]);
            runTerminalBoot(data.weapons[0]);
          }
        }
      } catch (err) {
        console.error('[Arsenal] Failed to fetch weapons:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWeapons();
  }, []);

  const runTerminalBoot = (weapon) => {
    if (!weapon) return;
    setTerminalOutput([]);
    const lines = [
      `$ loading weapon "${weapon.name}"...`,
      `$ challenge: ${weapon.challenge_type || 'General'}`,
      `$ difficulty: ${weapon.difficulty || 'standard'}`,
      `$ dmg=${weapon.damage} spd=${weapon.speed} acc=${weapon.accuracy}`,
      `$ function: ${weapon.function_name || 'solve'}()`,
      `$ WEAPON SYSTEM ONLINE ✓`,
    ];
    lines.forEach((line, i) => {
      setTimeout(() => {
        setTerminalOutput(prev => [...prev, line]);
      }, i * 200);
    });
  };

  const handleSelectWeapon = (weapon) => {
    setSelectedWeapon(weapon);
    runTerminalBoot(weapon);
  };

  const handleEquipAndPlay = async () => {
    if (!selectedWeapon) return;

    // Store in sessionStorage for combat page
    sessionStorage.setItem('selectedWeapon', JSON.stringify(selectedWeapon));

    if (isSignedIn) {
      setEquipping(true);
      try {
        await fetch('/api/weapons/equip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weaponId: selectedWeapon.id, equip: true }),
        });
      } catch (err) {
        console.warn('[Arsenal] Equip failed, continuing anyway');
      }
      setEquipping(false);
    }

    router.push('/matchmaking');
  };

  const filteredWeapons = category === 'all'
    ? weapons
    : weapons.filter(w => w.category === category);

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'easy': return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'medium': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      case 'hard': return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
      case 'expert': return 'text-red-400 border-red-500/30 bg-red-500/10';
      default: return 'text-gray-400 border-gray-500/30 bg-gray-500/10';
    }
  };

  const getStatBar = (value, max = 100, color = 'bg-cyan-500') => (
    <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex-1">
      <motion.div
        className={`h-full ${color} rounded-full`}
        initial={{ width: 0 }}
        animate={{ width: `${(value / max) * 100}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-green-400" />
        <span className="text-green-400 font-mono text-sm animate-pulse">Loading arsenal...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: 'linear-gradient(rgba(34, 197, 94, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.4) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-green-500/30 bg-black/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-green-500/10 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ArrowLeft className="w-5 h-5 text-green-400" />
            </motion.button>
            <div className="font-mono">
              <span className="text-green-400 text-xl font-bold">ARSENAL</span>
              <span className="text-green-500/60 ml-2">// Weapon Selection v2.0</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-mono text-sm">{weapons.length} weapons available</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Category Filter */}
        <div className="flex gap-3 mb-8">
          {['all', 'Primary', 'Secondary', 'Special'].map(cat => (
            <motion.button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 font-mono text-sm rounded-lg border transition-all ${
                category === cat
                  ? 'bg-green-500/20 border-green-500/60 text-green-400'
                  : 'border-green-500/20 text-green-500/60 hover:bg-green-500/10'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {cat === 'all' ? 'ALL' : cat.toUpperCase()}
            </motion.button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Weapon List */}
          <div className="lg:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            <AnimatePresence>
              {filteredWeapons.map((weapon, i) => (
                <motion.button
                  key={weapon.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleSelectWeapon(weapon)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedWeapon?.id === weapon.id
                      ? 'bg-green-500/15 border-green-500/60 shadow-lg shadow-green-500/10'
                      : 'bg-gray-900/50 border-gray-700/50 hover:bg-gray-800/50 hover:border-green-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-mono font-bold ${
                      selectedWeapon?.id === weapon.id ? 'text-green-400' : 'text-gray-300'
                    }`}>
                      {weapon.name}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded border font-mono ${getDifficultyColor(weapon.difficulty)}`}>
                      {(weapon.difficulty || 'easy').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 font-mono">
                    <span>DMG: {weapon.damage}</span>
                    <span>SPD: {weapon.speed}</span>
                    <span>ACC: {weapon.accuracy}</span>
                  </div>
                  {selectedWeapon?.id === weapon.id && (
                    <motion.div
                      layoutId="selectedIndicator"
                      className="mt-2 h-0.5 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full"
                    />
                  )}
                </motion.button>
              ))}
            </AnimatePresence>

            {filteredWeapons.length === 0 && (
              <div className="text-center text-gray-500 font-mono py-8">
                No weapons in this category
              </div>
            )}
          </div>

          {/* Weapon Detail + Terminal */}
          <div className="lg:col-span-2 space-y-6">
            {selectedWeapon ? (
              <>
                {/* Weapon Stats Card */}
                <motion.div
                  key={selectedWeapon.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-green-500/40 rounded-xl p-6"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-3xl font-bold text-green-400 font-mono mb-1">
                        {selectedWeapon.name}
                      </h2>
                      <p className="text-gray-400 text-sm">
                        {selectedWeapon.description || selectedWeapon.challenge_type || 'Combat weapon'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg border text-sm font-mono font-bold ${getDifficultyColor(selectedWeapon.difficulty)}`}>
                      {(selectedWeapon.difficulty || 'easy').toUpperCase()}
                    </span>
                  </div>

                  {/* Stats Bars */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3">
                      <span className="text-red-400 font-mono text-sm w-12">DMG</span>
                      {getStatBar(selectedWeapon.damage, 150, 'bg-red-500')}
                      <span className="text-white font-mono text-sm w-8">{selectedWeapon.damage}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-blue-400 font-mono text-sm w-12">SPD</span>
                      {getStatBar(selectedWeapon.speed, 100, 'bg-blue-500')}
                      <span className="text-white font-mono text-sm w-8">{selectedWeapon.speed}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-400 font-mono text-sm w-12">ACC</span>
                      {getStatBar(selectedWeapon.accuracy, 100, 'bg-green-500')}
                      <span className="text-white font-mono text-sm w-8">{selectedWeapon.accuracy}</span>
                    </div>
                  </div>

                  {/* Challenge Preview */}
                  {selectedWeapon.challenge_code && (
                    <div className="bg-black/50 border border-green-500/20 rounded-lg p-4 mb-4">
                      <div className="text-cyan-400 font-mono text-xs mb-2 flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        CHALLENGE PREVIEW
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {selectedWeapon.challenge_code}
                      </p>
                      <div className="mt-2 text-xs text-gray-500 font-mono">
                        Function: <span className="text-cyan-400">{selectedWeapon.function_name || 'solve'}()</span>
                        {' | '}Tests: <span className="text-cyan-400">{selectedWeapon.test_cases?.length || '?'}</span>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Terminal Boot Sequence */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-black/90 border border-green-500/30 rounded-xl overflow-hidden"
                >
                  <div className="bg-green-900/20 px-4 py-2 border-b border-green-500/20 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                      <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                    </div>
                    <span className="text-green-400 font-mono text-xs">weapon-loader@codR:~$</span>
                  </div>
                  <div className="p-4 min-h-[140px] font-mono text-sm space-y-1">
                    {terminalOutput.map((line, i) => (
                      <motion.div
                        key={`${selectedWeapon.id}-${i}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`${line.includes('ONLINE') || line.includes('✓') ? 'text-green-400' : 'text-green-500/80'}`}
                      >
                        {line}
                      </motion.div>
                    ))}
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="text-green-400"
                    >█</motion.span>
                  </div>
                </motion.div>

                {/* Action Button */}
                <motion.button
                  onClick={handleEquipAndPlay}
                  disabled={equipping}
                  className="w-full bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-700 hover:to-cyan-700 disabled:from-gray-700 disabled:to-gray-800 text-white font-bold py-4 px-8 rounded-xl transition-all font-mono text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-green-500/30"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {equipping ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> EQUIPPING...</>
                  ) : (
                    <><Target className="w-5 h-5" /> EQUIP & FIND MATCH <ChevronRight className="w-5 h-5" /></>
                  )}
                </motion.button>
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
