"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Loader2, CheckCircle, XCircle, Zap, Code, Trophy,
  RotateCcw, Swords, Timer, Shield, Flame, Star, TrendingUp,
  Home, Target, Bot, Lightbulb, Cpu, ChevronDown, ChevronUp,
} from 'lucide-react';

import { WEAPON_CATALOG, getWeaponById } from '../lib/weapons';
import {
  BOT_DIFFICULTIES, createBot, nextSolveTime, resolveBotAttempt,
  randomThinkingLine, randomLosingLine,
} from '../lib/bot';
import { recordLocalMatch } from '../lib/gameStore';
import { useSettings } from '../lib/settings';
import sfx from '../lib/sfx';
import CodeEditor from '../components/CodeEditor';

const INITIAL_HEALTH = 100;
const DEFAULT_TIMER = 120;
const MISS_PENALTY = 8;

export default function CombatPage() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const { settings } = useSettings();

  // ── Battle state ──────────────────────────────────────────────────────────
  const [userCode, setUserCode] = useState('');
  const [playerHealth, setPlayerHealth] = useState(INITIAL_HEALTH);
  const [opponentHealth, setOpponentHealth] = useState(INITIAL_HEALTH);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [error, setError] = useState(null);
  const [currentWeapon, setCurrentWeapon] = useState(null);
  const [isLoadingWeapon, setIsLoadingWeapon] = useState(true);
  const [roundNumber, setRoundNumber] = useState(1);
  const [battleLog, setBattleLog] = useState([]);
  const [battleOver, setBattleOver] = useState(false);
  const [attemptsThisChallenge, setAttemptsThisChallenge] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [comboCount, setComboCount] = useState(0);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_TIMER);
  const [timerActive, setTimerActive] = useState(false);

  // ── Match config ──────────────────────────────────────────────────────────
  const [matchConfig, setMatchConfig] = useState({
    gameMode: 'deathmatch',
    teamSize: '1v1',
    matchTime: DEFAULT_TIMER,
    opponent: null,
    vsComputer: true,
    botDifficulty: 'veteran',
  });

  // ── Bot state ─────────────────────────────────────────────────────────────
  const [bot, setBot] = useState(null);
  const [botProgress, setBotProgress] = useState(0);
  // Incremented after each attempt to re-arm the solve timer.
  const [botAttempt, setBotAttempt] = useState(0);

  // ── Results ───────────────────────────────────────────────────────────────
  const [showResults, setShowResults] = useState(false);
  const [matchResult, setMatchResult] = useState(null);

  const [weaponPool, setWeaponPool] = useState(WEAPON_CATALOG);
  const [usedWeaponIds, setUsedWeaponIds] = useState(() => new Set());

  // `matchEnded` guards against the timer and the health watcher both firing.
  const matchEnded = useRef(false);
  const botTimer = useRef(null);
  const logRef = useRef(null);

  const appendLog = useCallback((message, type = 'info') => {
    setBattleLog((prev) => [...prev.slice(-40), { message, type, at: Date.now() }]);
  }, []);

  // ── Load weapon + config ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      let config = null;
      let stored = null;

      try {
        config = JSON.parse(sessionStorage.getItem('matchConfig') || 'null');
        stored = JSON.parse(sessionStorage.getItem('selectedWeapon') || 'null');
      } catch {
        /* corrupt session data — fall through to defaults */
      }

      const resolved = {
        gameMode: 'deathmatch',
        teamSize: '1v1',
        matchTime: DEFAULT_TIMER,
        vsComputer: true,
        botDifficulty: settings.botDifficulty || 'veteran',
        opponent: null,
        ...(config || {}),
      };

      // Fetch the catalog (local-first API — succeeds with no database).
      let pool = WEAPON_CATALOG;
      try {
        const res = await fetch('/api/weapons');
        if (res.ok) {
          const data = await res.json();
          const playable = (data.weapons || []).filter((w) => w.test_cases?.length && w.function_name);
          if (playable.length) pool = playable;
        }
      } catch {
        /* the bundled catalog is already a complete game */
      }

      if (cancelled) return;

      const opening =
        (stored && (pool.find((w) => w.id === stored.id) || getWeaponById(stored.id))) ||
        pool[Math.floor(Math.random() * pool.length)];

      const opponent = resolved.opponent?.isBot
        ? resolved.opponent
        : resolved.vsComputer
          ? createBot(resolved.botDifficulty)
          : resolved.opponent;

      setWeaponPool(pool);
      setMatchConfig({ ...resolved, opponent });
      setBot(resolved.vsComputer ? opponent : null);
      setCurrentWeapon(opening);
      setUsedWeaponIds(new Set([opening.id]));
      setUserCode(opening.starter_code || '');
      setTimeRemaining(resolved.matchTime || DEFAULT_TIMER);
      setIsLoadingWeapon(false);

      appendLog(
        resolved.vsComputer
          ? `⚔️ Match start — ${opponent.username} [${(resolved.botDifficulty || 'veteran').toUpperCase()}]`
          : '⚔️ Match start — good luck.',
        'info'
      );
    };

    load();
    return () => { cancelled = true; };
    // Intentionally runs once: session config is read at mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Match end ─────────────────────────────────────────────────────────────
  const handleMatchEnd = useCallback(async (won, score) => {
    if (matchEnded.current) return;
    matchEnded.current = true;

    setBattleOver(true);
    setTimerActive(false);
    clearTimeout(botTimer.current);

    won ? sfx.victory() : sfx.defeat();

    // Local progress always advances — this is the offline floor.
    const local = recordLocalMatch({
      won,
      score,
      weaponId: currentWeapon?.id,
      opponent: matchConfig.opponent,
      difficulty: matchConfig.vsComputer ? matchConfig.botDifficulty : null,
      gameMode: matchConfig.gameMode,
    });

    let result = { ...local, persisted: false };

    if (userId) {
      try {
        const res = await fetch('/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            won,
            score,
            weaponId: currentWeapon?.id,
            opponentElo: matchConfig.opponent?.elo_rating,
            difficulty: matchConfig.vsComputer ? matchConfig.botDifficulty : null,
            gameMode: matchConfig.gameMode,
          }),
        });
        if (res.ok) {
          const server = await res.json();
          if (server.persisted) result = { ...result, ...server };
        }
      } catch {
        /* keep the local result */
      }
    }

    setMatchResult(result);
    setTimeout(() => setShowResults(true), 700);
  }, [currentWeapon, matchConfig, userId]);

  // ── Countdown ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentWeapon && !battleOver && !matchEnded.current) setTimerActive(true);
  }, [currentWeapon, battleOver]);

  useEffect(() => {
    if (!timerActive || battleOver) return;

    const id = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1;
        if (next === 10) sfx.warning();
        else if (next > 0 && next <= 5) sfx.tick();
        if (next <= 0) {
          clearInterval(id);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [timerActive, battleOver]);

  // Time expiry is decided outside the countdown so state updates stay pure.
  useEffect(() => {
    if (timeRemaining > 0 || battleOver || matchEnded.current || !currentWeapon) return;
    appendLog("⏰ TIME'S UP! The clock ran out.", 'defeat');
    handleMatchEnd(false, INITIAL_HEALTH - opponentHealth);
  }, [timeRemaining, battleOver, currentWeapon, opponentHealth, appendLog, handleMatchEnd]);

  // ── Health watcher ────────────────────────────────────────────────────────
  useEffect(() => {
    if (battleOver || matchEnded.current || !currentWeapon) return;

    if (opponentHealth <= 0) {
      appendLog('🏆 VICTORY! Opponent eliminated.', 'victory');
      handleMatchEnd(true, INITIAL_HEALTH - playerHealth);
    } else if (playerHealth <= 0) {
      appendLog("💀 DEFEATED! Your code wasn't fast enough.", 'defeat');
      handleMatchEnd(false, INITIAL_HEALTH - opponentHealth);
    }
  }, [playerHealth, opponentHealth, battleOver, currentWeapon, appendLog, handleMatchEnd]);

  // ── The computer opponent ─────────────────────────────────────────────────
  useEffect(() => {
    if (!matchConfig.vsComputer || !bot || battleOver || !currentWeapon || isLoadingWeapon) return;

    let cancelled = false;
    const difficulty = matchConfig.botDifficulty;
    const solveSeconds = nextSolveTime(difficulty);
    const startedAt = Date.now();

    setBotProgress(0);
    appendLog(`🤖 ${bot.username}: ${randomThinkingLine()}`, 'bot');

    // Progress bar ticks independently of the attack so it stays smooth.
    const progressId = setInterval(() => {
      if (cancelled) return;
      const elapsed = (Date.now() - startedAt) / 1000;
      setBotProgress(Math.min(100, (elapsed / solveSeconds) * 100));
    }, 100);

    botTimer.current = setTimeout(() => {
      if (cancelled) return;
      clearInterval(progressId);
      setBotProgress(100);

      const { landed, damage, taunt } = resolveBotAttempt(difficulty);

      if (landed) {
        sfx.incoming();
        setPlayerHealth((hp) => Math.max(0, hp - damage));
        appendLog(`🤖 ${bot.username} lands a solve — ${damage} damage! "${taunt}"`, 'bot-hit');
      } else {
        appendLog(`🤖 ${bot.username} fumbles: "${taunt}"`, 'bot-miss');
      }

      setBotAttempt((n) => n + 1); // re-arms this effect for the next attempt
    }, solveSeconds * 1000);

    return () => {
      cancelled = true;
      clearInterval(progressId);
      clearTimeout(botTimer.current);
    };
  }, [bot, matchConfig.vsComputer, matchConfig.botDifficulty, battleOver, currentWeapon, isLoadingWeapon, botAttempt, appendLog]);

  // Bot reacts when it starts losing badly.
  useEffect(() => {
    if (!bot || battleOver) return;
    if (opponentHealth > 0 && opponentHealth <= 30) {
      appendLog(`🤖 ${bot.username}: ${randomLosingLine()}`, 'bot');
    }
    // Only when crossing the threshold.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opponentHealth <= 30]);

  // ── Next challenge ────────────────────────────────────────────────────────
  const progressToNextChallenge = useCallback(() => {
    // A queued advance must not fire after the match has already been decided.
    if (matchEnded.current) return;

    const available = weaponPool.filter((w) => !usedWeaponIds.has(w.id));
    const pool = available.length > 0 ? available : weaponPool;
    if (pool.length === 0) return;

    const next = pool[Math.floor(Math.random() * pool.length)];
    setCurrentWeapon(next);
    setUsedWeaponIds((prev) => (available.length > 0 ? new Set([...prev, next.id]) : new Set([next.id])));
    setUserCode(next.starter_code || '');
    setExecutionResult(null);
    setError(null);
    setAttemptsThisChallenge(0);
    setShowHints(false);
    appendLog(`🔄 New challenge: ${next.name} — ${next.difficulty.toUpperCase()}`, 'info');
  }, [weaponPool, usedWeaponIds, appendLog]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!userCode.trim()) { setError('Write some code first.'); return; }
    if (!currentWeapon || isSubmitting || battleOver) return;

    setIsSubmitting(true);
    setError(null);
    setExecutionResult(null);
    setAttemptsThisChallenge((n) => n + 1);

    try {
      const response = await fetch('/api/battle/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weaponId: currentWeapon.id, userCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Judge returned ${response.status}`);
      }

      setExecutionResult(data);

      if (data.compileError) {
        sfx.miss();
        setError(data.compileError);
        setComboCount(0);
        appendLog(`⚠️ ${data.compileError}`, 'miss');
        setIsSubmitting(false);
        return;
      }

      if (data.damageDealt > 0) {
        // Bonuses reward speed, cleanliness and consecutive perfect solves.
        const firstTry = attemptsThisChallenge === 0 && data.perfect;
        const speedBonus = data.perfect ? Math.round((timeRemaining / (matchConfig.matchTime || DEFAULT_TIMER)) * 10) : 0;
        const comboBonus = data.perfect ? Math.min(10, comboCount * 3) : 0;
        const firstTryBonus = firstTry ? 5 : 0;
        const total = data.damageDealt + speedBonus + comboBonus + firstTryBonus;

        sfx.hit();
        setOpponentHealth((hp) => Math.max(0, hp - total));

        const extras = [
          speedBonus > 0 ? `+${speedBonus} speed` : null,
          comboBonus > 0 ? `+${comboBonus} combo` : null,
          firstTryBonus > 0 ? `+${firstTryBonus} first-try` : null,
        ].filter(Boolean);

        appendLog(
          `⚔️ ${data.passedTests}/${data.totalTests} tests — ${total} damage${extras.length ? ` (${extras.join(', ')})` : ''}`,
          'hit'
        );

        if (data.perfect) {
          setComboCount((c) => c + 1);
          appendLog('✅ All tests green. Loading next challenge…', 'victory');
          setTimeout(() => progressToNextChallenge(), 1400);
        }
      } else {
        sfx.miss();
        setComboCount(0);
        setPlayerHealth((hp) => Math.max(0, hp - MISS_PENALTY));
        appendLog(`💥 All tests failed — you take ${MISS_PENALTY} damage.`, 'miss');
      }

      setRoundNumber((r) => r + 1);
    } catch (err) {
      setError(err.message || 'Execution failed. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    userCode, currentWeapon, isSubmitting, battleOver, attemptsThisChallenge,
    timeRemaining, matchConfig.matchTime, comboCount, appendLog, progressToNextChallenge,
  ]);

  // Ctrl/Cmd+Enter submits from anywhere on the page.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSubmit]);

  // Keep the battle log scrolled to the newest entry.
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [battleLog]);

  const resetBattle = useCallback(() => {
    matchEnded.current = false;
    clearTimeout(botTimer.current);

    setPlayerHealth(INITIAL_HEALTH);
    setOpponentHealth(INITIAL_HEALTH);
    setExecutionResult(null);
    setError(null);
    setRoundNumber(1);
    setBattleLog([]);
    setBattleOver(false);
    setShowResults(false);
    setMatchResult(null);
    setAttemptsThisChallenge(0);
    setComboCount(0);
    setShowHints(false);
    setTimeRemaining(matchConfig.matchTime || DEFAULT_TIMER);
    setBotProgress(0);
    setBotAttempt((n) => n + 1);

    const next = weaponPool[Math.floor(Math.random() * weaponPool.length)];
    setCurrentWeapon(next);
    setUsedWeaponIds(new Set([next.id]));
    setUserCode(next.starter_code || '');

    if (matchConfig.vsComputer) {
      const fresh = createBot(matchConfig.botDifficulty);
      setBot(fresh);
      appendLog(`⚔️ Rematch — ${fresh.username} [${matchConfig.botDifficulty.toUpperCase()}]`, 'info');
    }
    setTimerActive(true);
  }, [matchConfig, weaponPool, appendLog]);

  const formatTime = (secs) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;

  const timerColor = timeRemaining > 60 ? 'text-green-400' : timeRemaining > 30 ? 'text-yellow-400' : 'text-red-400';
  const timerBorder = timeRemaining > 60 ? 'border-green-500/30' : timeRemaining > 30 ? 'border-yellow-500/30' : 'border-red-500/30';
  const difficultyMeta = BOT_DIFFICULTIES[matchConfig.botDifficulty] || BOT_DIFFICULTIES.veteran;

  const opponentName = useMemo(() => {
    if (matchConfig.vsComputer && bot) return `@${bot.username}`;
    if (matchConfig.opponent?.username) return `@${matchConfig.opponent.username}`;
    return 'AI OPPONENT';
  }, [matchConfig, bot]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (isLoadingWeapon) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
        <span className="text-cyan-400 font-mono text-sm">Initializing combat systems…</span>
      </div>
    );
  }

  if (!currentWeapon) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6 px-6 text-center">
        <Swords className="w-16 h-16 text-red-400" />
        <h2 className="text-red-400 font-mono text-xl">NO WEAPON EQUIPPED</h2>
        <p className="text-gray-400 font-mono text-sm">Pick a weapon in the arsenal to start a match.</p>
        <button onClick={() => router.push('/arsenal')} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl transition-colors font-mono">
          GO TO ARSENAL
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
        {timeRemaining <= 30 && !battleOver && (
          <motion.div
            className="absolute inset-0 border-4 border-red-500/20"
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
        )}
      </div>

      <div className="relative z-10 p-4 md:p-6 max-w-7xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline font-mono text-sm">EXIT ARENA</span>
          </button>

          <motion.div
            className={`flex items-center gap-3 px-4 sm:px-6 py-3 rounded-xl border ${timerBorder} bg-black/80 backdrop-blur-sm`}
            animate={timeRemaining <= 10 && !battleOver ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <Timer className={`w-5 h-5 ${timerColor}`} />
            <span className={`font-mono text-2xl font-bold ${timerColor}`}>{formatTime(timeRemaining)}</span>
          </motion.div>

          <div className="flex items-center gap-3 shrink-0">
            {comboCount > 1 && (
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500/15 border border-orange-500/40"
              >
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="font-mono text-sm font-bold text-orange-400">x{comboCount}</span>
              </motion.div>
            )}
            <div className="text-right font-mono text-sm">
              <div className="text-gray-500 text-xs">ROUND</div>
              <div className="text-white font-bold text-lg">{roundNumber}</div>
            </div>
          </div>
        </div>

        {/* Health bars */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-cyan-400 font-mono font-bold">YOU</span>
              <span className={`font-mono font-bold ${playerHealth > 50 ? 'text-green-400' : playerHealth > 25 ? 'text-yellow-400' : 'text-red-400'}`}>
                {playerHealth} HP
              </span>
            </div>
            <div className="h-6 bg-gray-800 rounded-full overflow-hidden border border-cyan-500/30 relative">
              <motion.div
                className={`h-full ${playerHealth > 50 ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : playerHealth > 25 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-red-500 to-red-700'}`}
                animate={{ width: `${playerHealth}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-red-400 font-mono font-bold flex items-center gap-1.5 truncate">
                {matchConfig.vsComputer && <Bot className="w-4 h-4 shrink-0" />}
                <span className="truncate">{opponentName}</span>
              </span>
              <span className={`font-mono font-bold shrink-0 ${opponentHealth > 50 ? 'text-green-400' : opponentHealth > 25 ? 'text-yellow-400' : 'text-red-400'}`}>
                {opponentHealth} HP
              </span>
            </div>
            <div className="h-6 bg-gray-800 rounded-full overflow-hidden border border-red-500/30 relative">
              <motion.div
                className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                animate={{ width: `${opponentHealth}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </div>

        {/* Bot solve progress — the thing you are actually racing */}
        {matchConfig.vsComputer && bot && !battleOver && (
          <div className="mb-6 bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between mb-2 text-xs font-mono">
              <span className="flex items-center gap-2 text-gray-400">
                <Cpu className={`w-4 h-4 ${difficultyMeta.color} animate-pulse`} />
                {bot.username} is solving…
              </span>
              <span className={`${difficultyMeta.color} font-bold`}>{difficultyMeta.name}</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${difficultyMeta.accent} transition-[width] duration-100 ease-linear`}
                style={{ width: `${botProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: challenge + editor */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-green-500/40 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3 gap-3">
                <h2 className="text-xl font-bold text-green-400 flex items-center gap-2 font-mono truncate">
                  <Code className="w-5 h-5 shrink-0" />
                  {currentWeapon.name}
                </h2>
                <span className={`text-xs px-2 py-1 rounded border font-mono shrink-0 ${
                  currentWeapon.difficulty === 'expert' ? 'text-red-400 border-red-500/30' :
                  currentWeapon.difficulty === 'hard' ? 'text-orange-400 border-orange-500/30' :
                  currentWeapon.difficulty === 'medium' ? 'text-yellow-400 border-yellow-500/30' :
                  'text-green-400 border-green-500/30'
                }`}>
                  {(currentWeapon.difficulty || 'easy').toUpperCase()}
                </span>
              </div>

              <div className="bg-black/40 border border-green-500/20 rounded-lg p-4">
                <p className="text-gray-300 text-sm leading-relaxed">{currentWeapon.challenge_code}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-gray-500">
                  <span>Function: <span className="text-cyan-400">{currentWeapon.function_name}()</span></span>
                  <span>Tests: <span className="text-cyan-400">{currentWeapon.test_cases?.length ?? '?'}</span></span>
                  <span>Damage: <span className="text-red-400">{currentWeapon.damage}</span></span>
                </div>
              </div>

              {currentWeapon.hints?.length > 0 && (
                <div className="mt-3">
                  <button
                    onClick={() => { setShowHints((s) => !s); sfx.select(); }}
                    className="flex items-center gap-2 text-xs font-mono text-yellow-400/80 hover:text-yellow-300 transition-colors"
                  >
                    <Lightbulb className="w-4 h-4" />
                    {showHints ? 'HIDE HINTS' : 'NEED A HINT?'}
                    {showHints ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <AnimatePresence>
                    {showHints && (
                      <motion.ul
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 space-y-1 overflow-hidden"
                      >
                        {currentWeapon.hints.map((hint, i) => (
                          <li key={i} className="text-xs font-mono text-yellow-300/70 pl-6">• {hint}</li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <CodeEditor
              value={userCode}
              onChange={setUserCode}
              onSubmit={handleSubmit}
              disabled={isSubmitting || battleOver}
              fontSize={settings.codeEditorFontSize}
              placeholder={currentWeapon.starter_code}
            />

            <div className="flex gap-3">
              <motion.button
                onClick={handleSubmit}
                disabled={isSubmitting || !userCode.trim() || battleOver}
                className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/30"
                whileHover={{ scale: isSubmitting || battleOver ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting || battleOver ? 1 : 0.98 }}
              >
                {isSubmitting
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> EXECUTING…</>
                  : <><Zap className="w-5 h-5" /> SUBMIT &amp; ATTACK</>}
                <kbd className="hidden md:inline text-[10px] font-mono opacity-60 border border-white/30 rounded px-1.5 py-0.5 ml-1">Ctrl↵</kbd>
              </motion.button>
              <button
                onClick={() => setUserCode(currentWeapon.starter_code || '')}
                disabled={battleOver}
                className="bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white font-bold py-4 px-6 rounded-xl transition-colors font-mono text-sm"
              >
                CLEAR
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="bg-red-500/15 border border-red-500/50 text-red-400 p-4 rounded-xl"
                >
                  <div className="flex items-start gap-2">
                    <XCircle className="w-5 h-5 mt-0.5 shrink-0" />
                    <pre className="text-sm whitespace-pre-wrap font-mono break-words">{error}</pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {executionResult && !executionResult.compileError && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-gradient-to-br from-gray-900 to-gray-800 border border-cyan-500/40 rounded-xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                    <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2 font-mono">
                      <Trophy className="w-5 h-5" /> RESULTS
                    </h3>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 font-mono">PASSED</div>
                      <div className="text-xl font-bold">
                        <span className="text-green-400">{executionResult.passedTests}</span>
                        <span className="text-gray-600">/</span>
                        <span className="text-gray-400">{executionResult.totalTests}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-lg p-4 text-center">
                    <div className="text-xs text-gray-400 font-mono">DAMAGE DEALT</div>
                    <div className="text-4xl font-bold text-red-400 font-mono">
                      {executionResult.damageDealt}<span className="text-lg ml-1">HP</span>
                    </div>
                    <div className="text-[11px] text-gray-500 font-mono mt-1">
                      judged in {executionResult.durationMs}ms
                    </div>
                  </div>

                  <div className="space-y-2">
                    {executionResult.testResults?.map((test, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border ${test.passed ? 'bg-green-500/5 border-green-500/30' : 'bg-red-500/5 border-red-500/30'}`}>
                        <div className="flex items-start gap-2">
                          {test.passed
                            ? <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                            : <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <div className={`font-mono text-xs font-bold ${test.passed ? 'text-green-400' : 'text-red-400'}`}>
                              Test {test.testNumber}: {test.description}
                            </div>
                            <div className="text-xs font-mono text-gray-600 mt-1 break-all">
                              In: {JSON.stringify(test.input)} → Want: {JSON.stringify(test.expected)}
                              {!test.passed && (
                                <> → Got: <span className="text-red-400">{JSON.stringify(test.actual)}</span></>
                              )}
                            </div>
                            {test.error && <div className="mt-1 text-xs text-red-400 font-mono break-words">{test.error}</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: info + log */}
          <div className="space-y-4">
            <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 font-mono flex items-center gap-2">
                <Shield className="w-4 h-4" /> MATCH INFO
              </h4>
              <div className="space-y-2 text-sm font-mono">
                <Row label="Mode" value={matchConfig.vsComputer ? 'vs Computer' : matchConfig.gameMode} />
                {matchConfig.vsComputer && (
                  <Row label="Difficulty" value={difficultyMeta.name} valueClass={difficultyMeta.color} />
                )}
                <Row label="Format" value={matchConfig.teamSize} />
                <Row label="Weapon" value={currentWeapon.name} valueClass="text-green-400" />
                <Row label="Solved" value={`${usedWeaponIds.size - 1}`} />
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 font-mono flex items-center gap-2">
                <Target className="w-4 h-4" /> BATTLE LOG
              </h4>
              <div ref={logRef} className="max-h-80 overflow-y-auto space-y-1.5">
                {battleLog.length === 0 ? (
                  <p className="text-gray-600 font-mono text-xs italic">Submit code to begin combat…</p>
                ) : battleLog.map((log, idx) => (
                  <motion.div
                    key={log.at + '-' + idx}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className={`text-xs font-mono py-1.5 px-2 rounded break-words ${
                      log.type === 'victory' ? 'text-green-400 bg-green-500/10 font-bold' :
                      log.type === 'defeat' ? 'text-red-400 bg-red-500/10 font-bold' :
                      log.type === 'hit' ? 'text-cyan-400' :
                      log.type === 'bot-hit' ? 'text-orange-400 bg-orange-500/5' :
                      log.type === 'bot-miss' ? 'text-gray-500' :
                      log.type === 'bot' ? 'text-purple-400' :
                      log.type === 'miss' ? 'text-yellow-400' :
                      'text-gray-400'
                    }`}
                  >
                    {log.message}
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <button onClick={() => router.push('/arsenal')} className="w-full text-left p-3 bg-gray-900/50 border border-gray-700/50 rounded-xl hover:border-green-500/30 transition-colors flex items-center gap-2 text-gray-400 hover:text-green-400 font-mono text-sm">
                <Swords className="w-4 h-4" /> Change Weapon
              </button>
              <button onClick={() => router.push('/leaderboard')} className="w-full text-left p-3 bg-gray-900/50 border border-gray-700/50 rounded-xl hover:border-yellow-500/30 transition-colors flex items-center gap-2 text-gray-400 hover:text-yellow-400 font-mono text-sm">
                <Trophy className="w-4 h-4" /> Leaderboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results overlay */}
      <AnimatePresence>
        {showResults && matchResult && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 50 }}
              transition={{ type: 'spring', damping: 20 }}
              className={`relative max-w-md w-full rounded-2xl border-2 p-8 ${
                matchResult.won
                  ? 'bg-gradient-to-br from-green-900/50 to-gray-900 border-green-500/50'
                  : 'bg-gradient-to-br from-red-900/50 to-gray-900 border-red-500/50'
              }`}
            >
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                  transition={{ delay: 0.2, type: 'spring' }} className="inline-block"
                >
                  {matchResult.won
                    ? <Trophy className="w-20 h-20 text-yellow-400 mx-auto" />
                    : <Swords className="w-20 h-20 text-red-400 mx-auto" />}
                </motion.div>
                <h2 className={`text-3xl font-bold font-mono mt-4 ${matchResult.won ? 'text-green-400' : 'text-red-400'}`}>
                  {matchResult.won ? 'VICTORY' : 'DEFEAT'}
                </h2>
                {matchConfig.vsComputer && bot && (
                  <p className="text-gray-500 font-mono text-xs mt-1">
                    vs @{bot.username} · {difficultyMeta.name}
                  </p>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <ResultRow icon={TrendingUp} label="ELO Change"
                  value={`${matchResult.eloDelta >= 0 ? '+' : ''}${matchResult.eloDelta}`}
                  valueClass={matchResult.eloDelta >= 0 ? 'text-green-400' : 'text-red-400'} />
                <ResultRow icon={Star} label="XP Gained" value={`+${matchResult.xpGain}`} valueClass="text-yellow-400" />
                <ResultRow icon={Shield} label="Rank" value={matchResult.rankTitle} valueClass="text-cyan-400" />
                {matchResult.streak > 0 && (
                  <ResultRow icon={Flame} label="Win Streak" value={`🔥 ${matchResult.streak}`} valueClass="text-orange-400" />
                )}
              </div>

              {!matchResult.persisted && (
                <p className="text-[11px] text-gray-500 font-mono text-center mb-4">
                  {userId ? 'Saved locally — cloud sync unavailable.' : 'Progress saved on this device. Sign in to sync.'}
                </p>
              )}

              <div className="space-y-3">
                <button
                  onClick={resetBattle}
                  className={`w-full py-3 rounded-xl font-mono font-bold transition-all ${
                    matchResult.won ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  <RotateCcw className="w-4 h-4 inline mr-2" />
                  {matchResult.won ? 'PLAY AGAIN' : 'REMATCH'}
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => router.push('/matchmaking')} className="py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl font-mono text-sm text-gray-300 transition-colors">
                    <Bot className="w-4 h-4 inline mr-1" /> New Match
                  </button>
                  <button onClick={() => router.push('/')} className="py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl font-mono text-sm text-gray-300 transition-colors">
                    <Home className="w-4 h-4 inline mr-1" /> Home
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, value, valueClass = 'text-white' }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-500">{label}</span>
      <span className={`${valueClass} truncate capitalize`}>{value}</span>
    </div>
  );
}

function ResultRow({ icon: Icon, label, value, valueClass }) {
  return (
    <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
      <span className="text-gray-400 font-mono text-sm flex items-center gap-2">
        <Icon className="w-4 h-4" /> {label}
      </span>
      <span className={`font-mono font-bold text-lg ${valueClass}`}>{value}</span>
    </div>
  );
}
