"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Loader2, CheckCircle, XCircle, Zap, Code, Trophy,
  RotateCcw, Swords, Timer, Shield, Flame, Star, TrendingUp,
  ChevronRight, Home, Target
} from 'lucide-react';

const INITIAL_HEALTH = 100;
const DEFAULT_TIMER = 120; // 2 minutes

export default function CombatPage() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();

  // Battle state
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

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_TIMER);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);

  // Match config (from matchmaking)
  const [matchConfig, setMatchConfig] = useState({
    gameMode: 'deathmatch',
    teamSize: '1v1',
    matchTime: DEFAULT_TIMER,
    opponent: null,
  });

  // Post-match overlay
  const [showResults, setShowResults] = useState(false);
  const [matchResult, setMatchResult] = useState(null);

  // All available weapons for multi-round
  const [weaponPool, setWeaponPool] = useState([]);
  const [usedWeaponIds, setUsedWeaponIds] = useState(new Set());

  // Load weapon and match config
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load match config from sessionStorage
        const storedConfig = sessionStorage.getItem('matchConfig');
        if (storedConfig) {
          const config = JSON.parse(storedConfig);
          setMatchConfig(config);
          setTimeRemaining(config.matchTime || DEFAULT_TIMER);
        }

        // Load selected weapon from sessionStorage
        const stored = sessionStorage.getItem('selectedWeapon');
        if (stored) {
          const weapon = JSON.parse(stored);
          setCurrentWeapon(weapon);
          setUsedWeaponIds(new Set([weapon.id]));
        }

        // Fetch all weapons for multi-round progression
        const res = await fetch('/api/weapons');
        if (res.ok) {
          const data = await res.json();
          const withChallenges = (data.weapons || []).filter(w => w.test_cases && w.function_name);
          setWeaponPool(withChallenges);

          // If no weapon was in session, pick one
          if (!stored && withChallenges.length > 0) {
            const weapon = withChallenges[Math.floor(Math.random() * withChallenges.length)];
            setCurrentWeapon(weapon);
            setUsedWeaponIds(new Set([weapon.id]));
          }
        }
      } catch (err) {
        console.error('[Combat] Failed to load data:', err);
        setError('Failed to load weapon. Please go back to arsenal.');
      } finally {
        setIsLoadingWeapon(false);
      }
    };
    loadData();
  }, []);

  // Start timer when weapon is loaded
  useEffect(() => {
    if (currentWeapon && !battleOver) {
      setTimerActive(true);
    }
  }, [currentWeapon, battleOver]);

  // Timer countdown
  useEffect(() => {
    if (!timerActive || battleOver) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up — player loses
          clearInterval(timerRef.current);
          setTimerActive(false);
          setBattleOver(true);
          setBattleLog(prev => [...prev, {
            round: roundNumber,
            message: '⏰ TIME\'S UP! The clock ran out!',
            type: 'defeat'
          }]);
          handleMatchEnd(false, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timerActive, battleOver, roundNumber]);

  // Check for health-based battle end
  useEffect(() => {
    if (battleOver) return;
    if (playerHealth <= 0) {
      setBattleOver(true);
      setTimerActive(false);
      setBattleLog(prev => [...prev, {
        round: roundNumber,
        message: '💀 DEFEATED! Your code wasn\'t fast enough.',
        type: 'defeat'
      }]);
      handleMatchEnd(false, INITIAL_HEALTH - opponentHealth);
    } else if (opponentHealth <= 0) {
      setBattleOver(true);
      setTimerActive(false);
      setBattleLog(prev => [...prev, {
        round: roundNumber,
        message: '🏆 VICTORY! You eliminated the opponent!',
        type: 'victory'
      }]);
      handleMatchEnd(true, INITIAL_HEALTH - playerHealth);
    }
  }, [playerHealth, opponentHealth]);

  const handleMatchEnd = async (won, score) => {
    let result = { won, score, eloDelta: 0, xpGain: 0, newElo: 1200, rankTitle: 'Recruit', streak: 0 };

    if (userId) {
      try {
        const res = await fetch('/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ won, score, weaponId: currentWeapon?.id }),
        });
        if (res.ok) {
          result = { ...result, ...(await res.json()) };
        }
      } catch (e) {
        console.error('[Combat] Match record failed:', e);
      }
    }

    setMatchResult(result);
    setTimeout(() => setShowResults(true), 800);
  };

  // Progress to next challenge within the same battle
  const progressToNextChallenge = useCallback(() => {
    const available = weaponPool.filter(w => !usedWeaponIds.has(w.id));
    if (available.length === 0) return;

    const next = available[Math.floor(Math.random() * available.length)];
    setCurrentWeapon(next);
    setUsedWeaponIds(prev => new Set([...prev, next.id]));
    setUserCode('');
    setExecutionResult(null);
    setError(null);
    setBattleLog(prev => [...prev, {
      round: roundNumber,
      message: `🔄 New challenge loaded: ${next.name}`,
      type: 'info'
    }]);
  }, [weaponPool, usedWeaponIds, roundNumber]);

  const handleSubmit = async () => {
    if (!userCode.trim()) { setError('Please write some code first!'); return; }
    if (!currentWeapon) { setError('No weapon selected'); return; }

    setIsSubmitting(true);
    setError(null);
    setExecutionResult(null);

    try {
      const response = await fetch('/api/battle/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weaponId: currentWeapon.id, userCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.testResults?.length > 0) {
          const syntaxErr = data.testResults.find(t => t.error?.toLowerCase().includes('syntax'));
          if (syntaxErr) throw new Error(`Syntax Error: ${syntaxErr.error}`);
        }
        throw new Error(data.error || data.details || `Server error: ${response.status}`);
      }

      setExecutionResult(data);

      if (data.success) {
        if (data.damageDealt > 0) {
          setOpponentHealth(prev => Math.max(0, prev - data.damageDealt));
          setBattleLog(prev => [...prev, {
            round: roundNumber,
            message: `⚔️ Round ${roundNumber}: ${data.damageDealt} damage dealt! (${data.passedTests}/${data.totalTests} tests)`,
            type: 'hit'
          }]);

          // Load next challenge after successful attack
          if (data.passedTests === data.totalTests) {
            setTimeout(() => progressToNextChallenge(), 1500);
          }
        } else if (data.passedTests === 0 && !data.error) {
          const penalty = 10;
          setPlayerHealth(prev => Math.max(0, prev - penalty));
          setBattleLog(prev => [...prev, {
            round: roundNumber,
            message: `💥 Round ${roundNumber}: All tests failed! -${penalty} HP`,
            type: 'miss'
          }]);
        }

        // AI counter-attack
        if (data.damageDealt < 50) {
          const aiDmg = Math.floor(Math.random() * 15) + 5;
          setTimeout(() => {
            setPlayerHealth(prev => Math.max(0, prev - aiDmg));
            setBattleLog(prev => [...prev, {
              round: roundNumber,
              message: `🤖 AI counter-attacks for ${aiDmg} damage!`,
              type: 'ai'
            }]);
          }, 600);
        }

        setRoundNumber(prev => prev + 1);
      } else {
        setError("The Judge is recharging. Try again.");
      }

    } catch (err) {
      setError(err.message || 'An error occurred during code execution');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetBattle = () => {
    setPlayerHealth(INITIAL_HEALTH);
    setOpponentHealth(INITIAL_HEALTH);
    setUserCode('');
    setExecutionResult(null);
    setError(null);
    setRoundNumber(1);
    setBattleLog([]);
    setBattleOver(false);
    setShowResults(false);
    setMatchResult(null);
    setTimeRemaining(matchConfig.matchTime || DEFAULT_TIMER);
    setTimerActive(true);
    setUsedWeaponIds(new Set());
    if (weaponPool.length > 0) {
      const w = weaponPool[Math.floor(Math.random() * weaponPool.length)];
      setCurrentWeapon(w);
      setUsedWeaponIds(new Set([w.id]));
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const timerColor = timeRemaining > 60 ? 'text-green-400' : timeRemaining > 30 ? 'text-yellow-400' : 'text-red-400';
  const timerBorder = timeRemaining > 60 ? 'border-green-500/30' : timeRemaining > 30 ? 'border-yellow-500/30' : 'border-red-500/30';

  if (isLoadingWeapon) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
        <span className="text-cyan-400 font-mono text-sm">Initializing combat systems...</span>
      </div>
    );
  }

  if (!currentWeapon) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6">
        <Swords className="w-16 h-16 text-red-400" />
        <h2 className="text-red-400 font-mono text-xl">NO WEAPON EQUIPPED</h2>
        <p className="text-gray-400 font-mono text-sm">Visit the arsenal to select a weapon first.</p>
        <button onClick={() => router.push('/arsenal')} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl transition-colors font-mono">
          GO TO ARSENAL
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Subtle animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
        {timeRemaining <= 30 && (
          <motion.div
            className="absolute inset-0 border-4 border-red-500/20 rounded-none"
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        )}
      </div>

      <div className="relative z-10 p-4 md:p-6 max-w-7xl mx-auto">
        {/* Top Bar: Nav + Timer + Round */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline font-mono text-sm">EXIT ARENA</span>
          </button>

          {/* Timer */}
          <motion.div
            className={`flex items-center gap-3 px-6 py-3 rounded-xl border ${timerBorder} bg-black/80 backdrop-blur-sm`}
            animate={timeRemaining <= 10 ? { scale: [1, 1.05, 1] } : {}}
            transition={timeRemaining <= 10 ? { duration: 0.5, repeat: Infinity } : {}}
          >
            <Timer className={`w-5 h-5 ${timerColor}`} />
            <span className={`font-mono text-2xl font-bold ${timerColor}`}>
              {formatTime(timeRemaining)}
            </span>
          </motion.div>

          <div className="flex items-center gap-3">
            <div className="text-right font-mono text-sm">
              <div className="text-gray-500">ROUND</div>
              <div className="text-white font-bold text-lg">{roundNumber}</div>
            </div>
            {battleOver && (
              <button onClick={resetBattle} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm font-mono">
                <RotateCcw className="w-4 h-4" /> REMATCH
              </button>
            )}
          </div>
        </div>

        {/* Health Bars */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Player */}
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
                transition={{ duration: 0.5 }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white/80">{playerHealth}%</div>
            </div>
          </div>

          {/* Opponent */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-red-400 font-mono font-bold">
                {matchConfig.opponent?.username ? `@${matchConfig.opponent.username}` : 'AI OPPONENT'}
              </span>
              <span className={`font-mono font-bold ${opponentHealth > 50 ? 'text-green-400' : opponentHealth > 25 ? 'text-yellow-400' : 'text-red-400'}`}>
                {opponentHealth} HP
              </span>
            </div>
            <div className="h-6 bg-gray-800 rounded-full overflow-hidden border border-red-500/30 relative">
              <motion.div
                className={`h-full ${opponentHealth > 50 ? 'bg-gradient-to-r from-red-500 to-orange-500' : opponentHealth > 25 ? 'bg-gradient-to-r from-orange-500 to-yellow-500' : 'bg-gradient-to-r from-yellow-500 to-green-500'}`}
                animate={{ width: `${opponentHealth}%` }}
                transition={{ duration: 0.5 }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white/80">{opponentHealth}%</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Challenge + Code Editor */}
          <div className="lg:col-span-2 space-y-4">
            {/* Current Challenge */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-green-500/40 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold text-green-400 flex items-center gap-2 font-mono">
                  <Code className="w-5 h-5" />
                  {currentWeapon.name}
                </h2>
                <span className={`text-xs px-2 py-1 rounded border font-mono ${
                  currentWeapon.difficulty === 'hard' ? 'text-orange-400 border-orange-500/30' :
                  currentWeapon.difficulty === 'medium' ? 'text-yellow-400 border-yellow-500/30' :
                  'text-green-400 border-green-500/30'
                }`}>
                  {(currentWeapon.difficulty || 'easy').toUpperCase()}
                </span>
              </div>
              <div className="bg-black/40 border border-green-500/20 rounded-lg p-4">
                <p className="text-gray-300 text-sm leading-relaxed">{currentWeapon.challenge_code}</p>
                <div className="mt-3 flex items-center gap-4 text-xs font-mono text-gray-500">
                  <span>Function: <span className="text-cyan-400">{currentWeapon.function_name}()</span></span>
                  <span>Tests: <span className="text-cyan-400">{currentWeapon.test_cases?.length || '?'}</span></span>
                  <span>Damage: <span className="text-red-400">{currentWeapon.damage}</span></span>
                </div>
              </div>
            </div>

            {/* Code Editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-cyan-400 font-mono text-sm font-bold flex items-center gap-2">
                  <Code className="w-4 h-4" /> YOUR CODE
                </label>
                <span className="text-gray-600 font-mono text-xs">{userCode.length} chars</span>
              </div>
              <textarea
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                placeholder={`function ${currentWeapon.function_name || 'solve'}(...args) {\n  // Write your solution here\n}`}
                className="w-full h-56 bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-xl border-2 border-gray-700 focus:border-cyan-500 focus:outline-none resize-none shadow-inner transition-colors"
                spellCheck="false"
                disabled={isSubmitting || battleOver}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const start = e.target.selectionStart;
                    const end = e.target.selectionEnd;
                    setUserCode(userCode.substring(0, start) + '  ' + userCode.substring(end));
                    setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = start + 2; }, 0);
                  }
                }}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <motion.button
                onClick={handleSubmit}
                disabled={isSubmitting || !userCode.trim() || battleOver}
                className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/30"
                whileHover={{ scale: isSubmitting || battleOver ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting || battleOver ? 1 : 0.98 }}
              >
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> EXECUTING...</>
                ) : (
                  <><Zap className="w-5 h-5" /> SUBMIT & ATTACK</>
                )}
              </motion.button>
              <button onClick={resetBattle} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-xl transition-colors font-mono text-sm">
                RESET
              </button>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-500/15 border border-red-500/50 text-red-400 p-4 rounded-xl"
                >
                  <div className="flex items-start gap-2">
                    <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <pre className="text-sm whitespace-pre-wrap font-mono">{error}</pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Execution Results */}
            <AnimatePresence>
              {executionResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
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
                  </div>

                  <div className="space-y-2">
                    {executionResult.testResults?.map((test, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border ${test.passed ? 'bg-green-500/5 border-green-500/30' : 'bg-red-500/5 border-red-500/30'}`}>
                        <div className="flex items-start gap-2">
                          {test.passed ? <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-400 mt-0.5" />}
                          <div className="flex-1">
                            <div className={`font-mono text-xs font-bold ${test.passed ? 'text-green-400' : 'text-red-400'}`}>
                              Test {test.testNumber}: {test.description}
                            </div>
                            <div className="text-xs font-mono text-gray-600 mt-1">
                              Input: {JSON.stringify(test.input)} → Expected: {JSON.stringify(test.expected)}
                              {test.actual !== null && test.actual !== undefined && (
                                <> → Got: <span className={test.passed ? 'text-green-400' : 'text-red-400'}>{JSON.stringify(test.actual)}</span></>
                              )}
                            </div>
                            {test.error && <div className="mt-1 text-xs text-red-400 font-mono">{test.error}</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Battle Log + Match Info */}
          <div className="space-y-4">
            {/* Match Info Card */}
            <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 font-mono flex items-center gap-2">
                <Shield className="w-4 h-4" /> MATCH INFO
              </h4>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-500">Mode</span>
                  <span className="text-white capitalize">{matchConfig.gameMode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Format</span>
                  <span className="text-white">{matchConfig.teamSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Weapon</span>
                  <span className="text-green-400">{currentWeapon.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rounds</span>
                  <span className="text-white">{roundNumber}</span>
                </div>
              </div>
            </div>

            {/* Battle Log */}
            <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 font-mono flex items-center gap-2">
                <Target className="w-4 h-4" /> BATTLE LOG
              </h4>
              <div className="max-h-80 overflow-y-auto space-y-1.5 scrollbar-thin">
                {battleLog.length === 0 ? (
                  <p className="text-gray-600 font-mono text-xs italic">Submit code to begin combat...</p>
                ) : (
                  battleLog.map((log, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`text-xs font-mono py-1.5 px-2 rounded ${
                        log.type === 'victory' ? 'text-green-400 bg-green-500/10 font-bold' :
                        log.type === 'defeat' ? 'text-red-400 bg-red-500/10 font-bold' :
                        log.type === 'hit' ? 'text-cyan-400' :
                        log.type === 'ai' ? 'text-orange-400' :
                        log.type === 'info' ? 'text-purple-400' :
                        'text-yellow-400'
                      }`}
                    >
                      {log.message}
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
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

      {/* Post-Match Results Overlay */}
      <AnimatePresence>
        {showResults && matchResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ type: 'spring', damping: 20 }}
              className={`relative max-w-md w-full mx-4 rounded-2xl border-2 p-8 ${
                matchResult.won
                  ? 'bg-gradient-to-br from-green-900/50 to-gray-900 border-green-500/50'
                  : 'bg-gradient-to-br from-red-900/50 to-gray-900 border-red-500/50'
              }`}
            >
              {/* Result Icon */}
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="inline-block"
                >
                  {matchResult.won ? (
                    <Trophy className="w-20 h-20 text-yellow-400 mx-auto" />
                  ) : (
                    <Swords className="w-20 h-20 text-red-400 mx-auto" />
                  )}
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className={`text-3xl font-bold font-mono mt-4 ${matchResult.won ? 'text-green-400' : 'text-red-400'}`}
                >
                  {matchResult.won ? 'VICTORY' : 'DEFEAT'}
                </motion.h2>
              </div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="space-y-3 mb-6"
              >
                <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                  <span className="text-gray-400 font-mono text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> ELO Change
                  </span>
                  <span className={`font-mono font-bold text-lg ${matchResult.eloDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {matchResult.eloDelta >= 0 ? '+' : ''}{matchResult.eloDelta}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                  <span className="text-gray-400 font-mono text-sm flex items-center gap-2">
                    <Star className="w-4 h-4" /> XP Gained
                  </span>
                  <span className="font-mono font-bold text-lg text-yellow-400">+{matchResult.xpGain}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                  <span className="text-gray-400 font-mono text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Rank
                  </span>
                  <span className="font-mono font-bold text-cyan-400">{matchResult.rankTitle}</span>
                </div>
                {matchResult.streak > 0 && (
                  <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                    <span className="text-gray-400 font-mono text-sm flex items-center gap-2">
                      <Flame className="w-4 h-4" /> Win Streak
                    </span>
                    <span className="font-mono font-bold text-orange-400">🔥 {matchResult.streak}</span>
                  </div>
                )}
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="space-y-3"
              >
                <button
                  onClick={resetBattle}
                  className={`w-full py-3 rounded-xl font-mono font-bold transition-all ${
                    matchResult.won
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  <RotateCcw className="w-4 h-4 inline mr-2" />
                  {matchResult.won ? 'PLAY AGAIN' : 'REMATCH'}
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => router.push('/leaderboard')} className="py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl font-mono text-sm text-gray-300 transition-colors">
                    <Trophy className="w-4 h-4 inline mr-1" /> Rankings
                  </button>
                  <button onClick={() => router.push('/')} className="py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl font-mono text-sm text-gray-300 transition-colors">
                    <Home className="w-4 h-4 inline mr-1" /> Home
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
