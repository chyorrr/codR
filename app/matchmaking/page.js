"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Eye, User, Shield, Code, Zap, Wifi, Activity, Cpu, Radar,
  Target, Crosshair, Users, Timer, Gamepad2, Settings, Bot, Play, X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { BOT_DIFFICULTIES, DIFFICULTY_ORDER, createBot } from '../lib/bot';
import { GAME_MODE_LIST, getGameMode } from '../lib/gameModes';
import { useSettings } from '../lib/settings';
import sfx from '../lib/sfx';

const TEAM_SIZES = ['1v1', '2v2', '3v3', '4v4'];
const ROUND_TIME = { '1v1': 120, '2v2': 150, '3v3': 180, '4v4': 240 };

// Single source of truth — combat reads the same definitions.
const GAME_MODES = GAME_MODE_LIST;

const SEARCH_SEQUENCE = [
  '> Initializing codR protocol...',
  '> Authenticating session...',
  '> Connected to arena network.',
  '> Scanning available opponents...',
  '> Analyzing skill compatibility...',
  '> Cross-referencing battle histories...',
  '> Establishing secure channel...',
  '> Match found. Preparing battlefield...',
];

export default function MatchmakingPage() {
  const router = useRouter();
  const { settings, updateSetting } = useSettings();

  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState('computer');           // 'computer' | 'search'
  const [difficulty, setDifficulty] = useState('veteran');
  const [teamSize, setTeamSize] = useState('1v1');
  const [gameMode, setGameMode] = useState('deathmatch');
  const [matchTime, setMatchTime] = useState(ROUND_TIME['1v1']);

  const [logs, setLogs] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [foundOpponent, setFoundOpponent] = useState(false);
  const [opponent, setOpponent] = useState(null);
  const [foundPlayers, setFoundPlayers] = useState([]);
  const [searchRadius, setSearchRadius] = useState(0);
  const [showProfile, setShowProfile] = useState(false);

  // Ambient telemetry
  const [networkNodes, setNetworkNodes] = useState(847);
  const [pingValue, setPingValue] = useState(12);
  const [systemLoad, setSystemLoad] = useState(45);
  const [radarSweep, setRadarSweep] = useState(0);

  const terminalRef = useRef(null);
  const timeouts = useRef([]);
  const radarInterval = useRef(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      timeouts.current.forEach(clearTimeout);
      clearInterval(radarInterval.current);
    };
  }, []);

  // Adopt the saved difficulty preference once settings hydrate.
  useEffect(() => {
    if (settings.botDifficulty) setDifficulty(settings.botDifficulty);
  }, [settings.botDifficulty]);

  // Each mode has a length that suits it (Endurance is long, Deathmatch short);
  // team size nudges it further for the search flow.
  useEffect(() => {
    setMatchTime(getGameMode(gameMode).defaultTime);
  }, [gameMode]);

  // Radar + telemetry animation, only while actually searching.
  useEffect(() => {
    if (!isSearching || foundOpponent) return;
    const id = setInterval(() => {
      setRadarSweep((p) => (p + 4) % 360);
      setNetworkNodes((p) => Math.max(400, p + Math.floor(Math.random() * 5) - 2));
      setPingValue((p) => Math.max(8, Math.min(45, p + Math.floor(Math.random() * 7) - 3)));
      setSystemLoad((p) => Math.max(30, Math.min(95, p + Math.floor(Math.random() * 11) - 5)));
    }, 60);
    return () => clearInterval(id);
  }, [isSearching, foundOpponent]);

  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [logs]);

  const track = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timeouts.current.push(id);
    return id;
  };

  const pushLog = (text, type = 'search') =>
    setLogs((prev) => [...prev, { id: `${type}-${prev.length}-${Date.now()}`, text, type, timestamp: new Date().toLocaleTimeString() }]);

  // ── Launch straight into a bot match ──────────────────────────────────────
  const startComputerMatch = useCallback(() => {
    sfx.alert();
    const bot = createBot(difficulty);
    updateSetting('botDifficulty', difficulty);

    sessionStorage.setItem('matchConfig', JSON.stringify({
      gameMode, teamSize, matchTime, vsComputer: true, botDifficulty: difficulty, opponent: bot,
    }));
    router.push('/combat');
  }, [difficulty, gameMode, teamSize, matchTime, router, updateSetting]);

  // ── Simulated opponent search ─────────────────────────────────────────────
  const startSearch = useCallback(() => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];

    setIsSearching(true);
    setFoundOpponent(false);
    setOpponent(null);
    setSearchRadius(0);
    setFoundPlayers([]);
    sfx.select();

    setLogs([
      { id: 'cfg-1', text: `> CONFIG: TEAM_SIZE=${teamSize}`, type: 'config', timestamp: new Date().toLocaleTimeString() },
      { id: 'cfg-2', text: `> CONFIG: GAME_MODE=${gameMode}`, type: 'config', timestamp: new Date().toLocaleTimeString() },
      { id: 'cfg-3', text: `> CONFIG: ROUND_TIME=${matchTime}s`, type: 'config', timestamp: new Date().toLocaleTimeString() },
    ]);

    radarInterval.current = setInterval(() => {
      setSearchRadius((prev) => {
        if (prev >= 100) { clearInterval(radarInterval.current); return 100; }
        return prev + 2;
      });
    }, 90);

    track(() => setFoundPlayers([createBot('rookie'), createBot('veteran'), createBot('elite')].map((p) => ({
      ...p,
      distance: Math.floor(Math.random() * 500) + 100,
      compatibility: Math.floor(Math.random() * 40) + 60,
    }))), 2600);

    SEARCH_SEQUENCE.forEach((line, i) => {
      track(() => pushLog(line), 900 + i * 620);
    });

    track(() => {
      const found = createBot(difficulty);
      setOpponent(found);
      setFoundOpponent(true);
      sfx.alert();
    }, 900 + SEARCH_SEQUENCE.length * 620 + 500);
  }, [teamSize, gameMode, matchTime, difficulty]);

  /** Tears down an in-flight search without navigating anywhere. */
  const resetSearch = useCallback(() => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    clearInterval(radarInterval.current);
    setIsSearching(false);
    setFoundOpponent(false);
    setOpponent(null);
    setLogs([]);
    setSearchRadius(0);
    setFoundPlayers([]);
  }, []);

  /** The ABORT/EXIT control: abort a running search, otherwise leave the page. */
  const cancelSearch = () => {
    if (isSearching || foundOpponent) resetSearch();
    else router.push('/');
  };

  const engageCombat = () => {
    sessionStorage.setItem('matchConfig', JSON.stringify({
      gameMode, teamSize, matchTime,
      vsComputer: true,                  // opponents are simulated for now
      botDifficulty: opponent?.difficulty || difficulty,
      opponent,
    }));
    router.push('/combat');
  };

  const randomize = () => {
    setTeamSize(TEAM_SIZES[Math.floor(Math.random() * TEAM_SIZES.length)]);
    setGameMode(GAME_MODES[Math.floor(Math.random() * GAME_MODES.length)].id);
    setDifficulty(DIFFICULTY_ORDER[Math.floor(Math.random() * DIFFICULTY_ORDER.length)]);
    sfx.select();
  };

  const getRankColor = (rank = '') => {
    if (rank.includes('Silver')) return 'text-gray-400';
    if (rank.includes('Gold')) return 'text-yellow-400';
    if (rank.includes('Platinum')) return 'text-blue-400';
    if (rank.includes('Diamond')) return 'text-purple-400';
    if (rank.includes('Master') || rank.includes('Grandmaster')) return 'text-red-400';
    return 'text-green-400';
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        {mounted && Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={`net-${i}`}
            className="absolute w-px bg-gradient-to-b from-transparent via-cyan-500/25 to-transparent"
            style={{ left: `${10 + i * 12}%`, height: '100%' }}
            animate={{ opacity: [0.1, 0.5, 0.1] }}
            transition={{ duration: 3 + i * 0.3, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
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
            <div className="font-mono text-green-400 truncate">
              <span className="text-xl font-bold">codR</span>
              <span className="text-green-500/60 ml-2 hidden sm:inline">// Matchmaking Terminal v4.0</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Telemetry icon={Wifi} value={`${networkNodes} nodes`} className="text-cyan-400" />
            <Telemetry icon={Activity} value={`${pingValue}ms`} className="text-yellow-400" />
            <Telemetry icon={Cpu} value={`${systemLoad}%`} className="text-red-400" />
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Mode switch */}
        <div className="grid grid-cols-2 gap-3 mb-8 max-w-2xl">
          <ModeButton
            active={mode === 'computer'}
            onClick={() => { setMode('computer'); resetSearch(); sfx.select(); }}
            icon={Bot}
            title="PLAY VS COMPUTER"
            subtitle="Instant match against an AI opponent"
          />
          <ModeButton
            active={mode === 'search'}
            onClick={() => { setMode('search'); sfx.select(); }}
            icon={Radar}
            title="FIND OPPONENT"
            subtitle="Scan the arena network"
          />
        </div>

        {mode === 'computer' ? (
          /* ─────────────────── VS COMPUTER ─────────────────── */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Panel title="SELECT_DIFFICULTY" icon={Cpu}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DIFFICULTY_ORDER.map((id, i) => {
                    const d = BOT_DIFFICULTIES[id];
                    const active = difficulty === id;
                    return (
                      <motion.button
                        key={id}
                        onClick={() => { setDifficulty(id); sfx.select(); }}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                          active ? `${d.border} bg-white/[0.03]` : 'border-gray-800 hover:border-gray-700'
                        }`}
                        aria-pressed={active}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-mono font-bold ${d.color}`}>{d.name}</span>
                          {active && <div className={`w-2 h-2 rounded-full ${d.accent} animate-pulse`} />}
                        </div>
                        <p className="text-gray-500 text-xs font-mono mb-3">{d.description}</p>
                        <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                          <Stat label="SOLVE" value={`${d.solveTime[0]}-${d.solveTime[1]}s`} />
                          <Stat label="ACCURACY" value={`${Math.round(d.successRate * 100)}%`} />
                          <Stat label="DAMAGE" value={`${d.damage[0]}-${d.damage[1]}`} />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </Panel>

              <Panel title="SELECT_MODE" icon={Gamepad2}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {GAME_MODES.map((m, i) => {
                    const active = gameMode === m.id;
                    return (
                      <motion.button
                        key={m.id}
                        onClick={() => { setGameMode(m.id); sfx.select(); }}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        aria-pressed={active}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                          active ? 'border-purple-500/60 bg-purple-500/10' : 'border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        <div className={`font-mono font-bold text-sm ${active ? 'text-purple-300' : 'text-gray-400'}`}>
                          {m.name}
                        </div>
                        <p className="text-gray-500 text-xs font-mono mt-1">{m.description}</p>
                        <p className={`text-[11px] font-mono mt-2 ${active ? 'text-purple-400/80' : 'text-gray-600'}`}>
                          {m.tagline}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              </Panel>

              <Panel title="ROUND_LENGTH" icon={Timer}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[60, 120, 180, 300].map((secs) => (
                    <button
                      key={secs}
                      onClick={() => { setMatchTime(secs); sfx.select(); }}
                      className={`py-3 rounded-lg border font-mono text-sm transition-all ${
                        matchTime === secs
                          ? 'bg-green-500/20 border-green-500/60 text-green-400'
                          : 'border-green-500/20 text-green-500/60 hover:bg-green-500/10'
                      }`}
                      aria-pressed={matchTime === secs}
                    >
                      {secs >= 60 ? `${secs / 60} min` : `${secs}s`}
                    </button>
                  ))}
                </div>
              </Panel>

              <motion.button
                onClick={startComputerMatch}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="w-full bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-700 hover:to-cyan-700 text-white font-bold py-5 rounded-xl font-mono text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-green-500/30 transition-all"
              >
                <Play className="w-6 h-6" /> DEPLOY TO ARENA
              </motion.button>
            </div>

            {/* Briefing */}
            <div className="space-y-4">
              <div className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-5">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide font-mono mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Briefing
                </h3>
                <ul className="space-y-3 text-sm text-gray-400 font-mono">
                  <li className="flex gap-2"><span className="text-green-400">01</span> Solve the challenge to damage your opponent.</li>
                  <li className="flex gap-2"><span className="text-green-400">02</span> Every test that passes adds damage.</li>
                  <li className="flex gap-2"><span className="text-green-400">03</span> The bot solves on its own clock — beat it to the punch.</li>
                  <li className="flex gap-2"><span className="text-green-400">04</span> Perfect solves chain into a combo multiplier.</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-gray-800 text-xs font-mono text-gray-500">
                  <kbd className="border border-gray-700 rounded px-1.5 py-0.5">Ctrl</kbd>
                  {' + '}
                  <kbd className="border border-gray-700 rounded px-1.5 py-0.5">Enter</kbd>
                  {' '}submits your code.
                </div>
              </div>

              <div className={`rounded-xl border-2 p-5 ${BOT_DIFFICULTIES[difficulty].border} bg-black/40`}>
                <div className="text-xs font-mono text-gray-500 mb-1">LOADOUT</div>
                {getGameMode(gameMode).scoreAttack ? (
                  <>
                    <div className="text-2xl font-bold font-mono text-amber-400">SOLO RUN</div>
                    <p className="text-gray-500 text-xs font-mono mt-2">
                      {getGameMode(gameMode).name} has no opponent — score is all that matters.
                    </p>
                  </>
                ) : (
                  <>
                    <div className={`text-2xl font-bold font-mono ${BOT_DIFFICULTIES[difficulty].color}`}>
                      {BOT_DIFFICULTIES[difficulty].name}
                    </div>
                    <p className="text-gray-500 text-xs font-mono mt-2">{BOT_DIFFICULTIES[difficulty].description}</p>
                  </>
                )}
                <div className="mt-3 pt-3 border-t border-gray-800 text-xs font-mono text-gray-500">
                  {getGameMode(gameMode).name} · {matchTime}s
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ─────────────────── FIND OPPONENT ─────────────────── */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Terminal */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-black/70 border border-green-500/40 rounded-lg backdrop-blur-md overflow-hidden"
              >
                <div className="bg-gradient-to-r from-green-900/30 to-cyan-900/30 px-6 py-3 border-b border-green-500/30 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                    </div>
                    <span className="text-green-400 font-mono text-sm">terminal@codR:~$</span>
                  </div>
                  {isSearching && !foundOpponent && (
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border border-green-500/60 border-t-green-500 rounded-full"
                      />
                      <span className="text-green-400 font-mono text-xs">SCANNING</span>
                    </div>
                  )}
                </div>

                <div ref={terminalRef} className="h-80 overflow-y-auto font-mono text-sm p-6 space-y-2 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.9),rgba(0,20,0,0.95))]">
                  {logs.length === 0 && (
                    <p className="text-green-500/40">Press INITIATE_SEARCH to scan the network…</p>
                  )}
                  {logs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-3"
                    >
                      <span className="text-green-500/50 text-xs mt-0.5 select-none min-w-[68px]">[{log.timestamp}]</span>
                      <span className={log.type === 'config' ? 'text-cyan-400' : 'text-green-400'}>{log.text}</span>
                    </motion.div>
                  ))}
                  {isSearching && !foundOpponent && (
                    <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="inline-block text-green-400">█</motion.span>
                  )}
                </div>
              </motion.div>

              {/* Found → engage */}
              {foundOpponent && opponent && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-black/40 border border-green-500/20 rounded-lg p-4 backdrop-blur-sm"
                >
                  <div className="text-red-400 font-mono text-sm flex items-center mb-3">
                    <Gamepad2 className="w-4 h-4 mr-2" /> BATTLE_CONFIG
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <MiniStat label="MODE" value={GAME_MODES.find((m) => m.id === gameMode)?.name || gameMode} />
                    <MiniStat label="TEAM" value={teamSize} />
                    <MiniStat label="TIME" value={`${matchTime}s`} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <motion.button
                      onClick={engageCombat}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-mono font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <Target className="w-4 h-4" /> ENGAGE_COMBAT
                    </motion.button>
                    <motion.button
                      onClick={() => { setShowProfile(true); sfx.select(); }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="w-full bg-transparent border border-green-500/30 hover:bg-green-500/10 text-green-300 py-3 px-4 rounded-lg font-mono transition-colors flex items-center justify-center gap-2"
                    >
                      <User className="w-4 h-4" /> VIEW_FULL_PROFILE
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Controls */}
              <div className="bg-black/50 border border-green-500/30 rounded-lg p-6 backdrop-blur-md grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={cancelSearch}
                  className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 py-3 px-4 rounded-lg font-mono transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> {isSearching ? 'ABORT' : 'EXIT'}
                </button>
                <button
                  onClick={() => { resetSearch(); sfx.select(); }}
                  disabled={!isSearching}
                  className="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 py-3 px-4 rounded-lg font-mono transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4" /> RECONFIGURE
                </button>
                <button
                  onClick={() => router.push('/leaderboard')}
                  className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 py-3 px-4 rounded-lg font-mono transition-all flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" /> RANKINGS
                </button>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {isSearching && !foundOpponent && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="bg-black/70 border border-cyan-500/40 rounded-lg p-6 backdrop-blur-md"
                >
                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Radar className="w-5 h-5 text-cyan-400" />
                      <span className="text-cyan-400 font-mono text-sm">OPPONENT_SCANNER</span>
                    </div>
                    <div className="text-cyan-300/60 font-mono text-xs">
                      Range: {searchRadius}% | Targets: {foundPlayers.length}
                    </div>
                  </div>

                  <div className="relative w-56 h-56 mx-auto">
                    <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30" />
                    <div className="absolute inset-4 rounded-full border border-cyan-500/20" />
                    <div className="absolute inset-8 rounded-full border border-cyan-500/15" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <Crosshair className="w-4 h-4 text-cyan-400" />
                    </div>

                    <div className="absolute top-1/2 left-1/2" style={{ transform: `rotate(${radarSweep}deg)` }}>
                      <div className="w-28 h-px bg-gradient-to-r from-cyan-400 to-transparent origin-left" />
                    </div>

                    {/* Blips are placed on a real circle — degrees converted to radians. */}
                    {foundPlayers.map((player, i) => {
                      const angle = (i * 120 * Math.PI) / 180;
                      return (
                        <motion.div
                          key={player.username}
                          className="absolute w-2.5 h-2.5 bg-red-400 rounded-full -translate-x-1/2 -translate-y-1/2"
                          style={{
                            left: `${50 + Math.cos(angle) * 30}%`,
                            top: `${50 + Math.sin(angle) * 30}%`,
                          }}
                          initial={{ scale: 0 }} animate={{ scale: [0, 1.5, 1] }}
                          transition={{ delay: i * 0.3, duration: 0.5 }}
                        />
                      );
                    })}
                  </div>

                  {foundPlayers.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="text-cyan-400 font-mono text-xs">DETECTED TARGETS:</div>
                      {foundPlayers.map((player, i) => (
                        <motion.div
                          key={player.username}
                          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.2 }}
                          className="flex items-center justify-between bg-black/40 rounded px-3 py-2 border border-cyan-500/20"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse shrink-0" />
                            <span className="text-white font-mono text-xs truncate">{player.username}</span>
                          </div>
                          <span className="text-cyan-400 font-mono text-xs shrink-0">
                            {player.compatibility}% | {player.distance}km
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Opponent card */}
              <AnimatePresence>
                {foundOpponent && opponent && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="bg-gradient-to-br from-red-500/10 to-yellow-500/10 border-2 border-red-500/40 rounded-xl p-6 backdrop-blur-md"
                  >
                    <h2 className="text-2xl font-bold text-red-400 font-mono mb-4 text-center">MATCH_FOUND</h2>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-xl border-2 border-red-500/60 bg-gray-900 flex items-center justify-center shrink-0">
                        <Bot className="w-8 h-8 text-red-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xl font-bold text-red-400 font-mono truncate">@{opponent.username}</div>
                        <div className={`text-sm font-mono ${getRankColor(opponent.rank_title)}`}>
                          <Shield className="w-4 h-4 inline mr-1" />{opponent.rank_title} · {opponent.elo_rating}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">{opponent.location}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <StatCard label="WINS" value={opponent.wins} className="text-green-400 border-green-500/30" />
                      <StatCard label="LOSSES" value={opponent.losses} className="text-red-400 border-red-500/30" />
                    </div>

                    <div className="bg-black/30 rounded-lg p-3 border border-purple-500/30 mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-purple-400 font-mono text-xs">CURRENT_STREAK</span>
                        <Zap className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="text-2xl font-bold text-purple-300">{opponent.killStreak}</div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-yellow-400 font-mono text-xs flex items-center gap-2">
                        <Code className="w-4 h-4" /> ARSENAL
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {opponent.languages.map((lang) => (
                          <span key={lang} className="px-2.5 py-1 bg-yellow-500/15 border border-yellow-500/40 text-yellow-300 rounded text-xs font-mono">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Config */}
              {!foundOpponent && (
                <div className="bg-black/60 border-2 border-green-500/30 rounded-xl p-6 backdrop-blur-md space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-400 font-mono font-bold">BATTLE_CONFIGURATION</span>
                  </div>

                  <div>
                    <div className="font-mono text-green-400 mb-3 flex items-center text-sm">
                      <Users className="w-4 h-4 mr-2" /> TEAM_SIZE
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {TEAM_SIZES.map((size) => (
                        <button
                          key={size}
                          onClick={() => { setTeamSize(size); sfx.select(); }}
                          className={`py-2 font-mono text-sm border rounded transition-all ${
                            teamSize === size
                              ? 'bg-green-500/20 border-green-500/60 text-green-400'
                              : 'border-green-500/20 text-green-500/60 hover:bg-green-500/10'
                          }`}
                          aria-pressed={teamSize === size}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    <div className="font-mono text-green-500/60 text-xs mt-2 flex items-center">
                      <Timer className="w-3 h-3 mr-1" /> {matchTime}s per round
                    </div>
                  </div>

                  <div>
                    <div className="font-mono text-green-400 mb-3 flex items-center text-sm">
                      <Gamepad2 className="w-4 h-4 mr-2" /> GAME_MODE
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {GAME_MODES.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => { setGameMode(m.id); sfx.select(); }}
                          className={`py-2 px-3 font-mono text-sm text-left border rounded transition-all ${
                            gameMode === m.id
                              ? 'bg-green-500/20 border-green-500/60 text-green-400'
                              : 'border-green-500/20 text-green-500/60 hover:bg-green-500/10'
                          }`}
                          aria-pressed={gameMode === m.id}
                        >
                          <div className="font-bold">{m.name}</div>
                          <div className="text-xs opacity-70">{m.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={startSearch}
                      disabled={isSearching}
                      className="bg-green-500/10 hover:bg-green-500/20 disabled:opacity-40 border border-green-500/40 text-green-400 font-mono py-3 px-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Target className="w-4 h-4" /> INITIATE_SEARCH
                    </button>
                    <button
                      onClick={randomize}
                      className="bg-transparent border border-green-500/20 hover:bg-green-500/10 text-green-400 font-mono py-3 px-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4" /> RANDOM_CONFIG
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Opponent profile modal */}
      <AnimatePresence>
        {showProfile && opponent && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
            onClick={() => setShowProfile(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border-2 border-red-500/40 rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="min-w-0">
                  <h3 className="text-xl font-bold text-red-400 font-mono truncate">@{opponent.username}</h3>
                  <p className={`text-sm font-mono ${getRankColor(opponent.rank_title)}`}>
                    {opponent.rank_title} · ELO {opponent.elo_rating}
                  </p>
                </div>
                <button onClick={() => setShowProfile(false)} className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400" aria-label="Close profile">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <dl className="space-y-2 text-sm font-mono">
                <ProfileRow label="Specialty" value={opponent.specialty} />
                <ProfileRow label="Location" value={opponent.location} />
                <ProfileRow label="Record" value={`${opponent.wins}W / ${opponent.losses}L`} />
                <ProfileRow label="Kill streak" value={opponent.killStreak} />
                <ProfileRow label="Avg solve" value={`${opponent.avgResponseTime}s`} />
                <ProfileRow label="Languages" value={opponent.languages.join(', ')} />
              </dl>

              <button
                onClick={engageCombat}
                className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl font-mono transition-colors flex items-center justify-center gap-2"
              >
                <Target className="w-4 h-4" /> ENGAGE
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── small presentational helpers ─────────────────────────────────────────── */

function Telemetry({ icon: Icon, value, className }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${className}`} />
      <span className={`font-mono text-xs ${className}`}>{value}</span>
    </div>
  );
}

function ModeButton({ active, onClick, icon: Icon, title, subtitle }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      aria-pressed={active}
      className={`p-4 rounded-xl border-2 text-left transition-all ${
        active ? 'border-green-500/60 bg-green-500/10' : 'border-gray-800 hover:border-gray-700 bg-black/40'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-5 h-5 ${active ? 'text-green-400' : 'text-gray-500'}`} />
        <span className={`font-mono font-bold text-sm ${active ? 'text-green-400' : 'text-gray-400'}`}>{title}</span>
      </div>
      <p className="text-xs font-mono text-gray-500">{subtitle}</p>
    </motion.button>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <div className="bg-black/50 border border-green-500/30 rounded-xl p-6 backdrop-blur-md">
      <div className="flex items-center gap-3 mb-5">
        <Icon className="w-5 h-5 text-green-400" />
        <span className="text-green-400 font-mono font-bold">{title}</span>
        <div className="flex-1 h-px bg-gradient-to-r from-green-500/40 to-transparent" />
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-black/40 rounded px-2 py-1">
      <div className="text-gray-600">{label}</div>
      <div className="text-gray-300 font-bold">{value}</div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-black/30 rounded p-2 text-center border border-green-500/10">
      <div className="text-green-300 font-mono text-xs">{label}</div>
      <div className="text-white font-mono text-sm font-bold truncate">{value}</div>
    </div>
  );
}

function StatCard({ label, value, className }) {
  return (
    <div className={`bg-black/40 rounded-lg p-3 border ${className}`}>
      <div className="font-mono text-xs">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-gray-800">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-200 text-right truncate">{value}</dd>
    </div>
  );
}
