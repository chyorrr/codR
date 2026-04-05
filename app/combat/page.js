"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { ArrowLeft, Loader2, CheckCircle, XCircle, Zap, Code, Trophy, RotateCcw, Swords } from 'lucide-react';

const INITIAL_HEALTH = 100;

export default function CombatPage() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
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

  // Load weapon from sessionStorage or fall back to fetching from API
  useEffect(() => {
    const loadWeapon = async () => {
      try {
        // Try sessionStorage first (set during arsenal selection)
        const stored = sessionStorage.getItem('selectedWeapon');
        if (stored) {
          const weapon = JSON.parse(stored);
          setCurrentWeapon(weapon);
          setIsLoadingWeapon(false);
          return;
        }

        // Fallback: fetch a random weapon from API
        const res = await fetch('/api/weapons');
        if (res.ok) {
          const data = await res.json();
          if (data.weapons && data.weapons.length > 0) {
            // Pick a random weapon that has test cases
            const withChallenges = data.weapons.filter(w => w.test_cases && w.function_name);
            if (withChallenges.length > 0) {
              const weapon = withChallenges[Math.floor(Math.random() * withChallenges.length)];
              setCurrentWeapon(weapon);
            } else {
              setCurrentWeapon(data.weapons[0]);
            }
          }
        }
      } catch (err) {
        console.error('[Combat] Failed to load weapon:', err);
        setError('Failed to load weapon. Please go back to arsenal.');
      } finally {
        setIsLoadingWeapon(false);
      }
    };

    loadWeapon();
  }, []);

  // Check for battle end
  useEffect(() => {
    if (playerHealth <= 0 || opponentHealth <= 0) {
      setBattleOver(true);
      const won = opponentHealth <= 0;
      setBattleLog(prev => [...prev, {
        round: roundNumber,
        message: won ? '🏆 VICTORY! You eliminated the opponent!' : '💀 DEFEATED! Your code wasn\'t fast enough.',
        type: won ? 'victory' : 'defeat'
      }]);

      // Record match result
      if (userId && currentWeapon) {
        fetch('/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            won,
            score: won ? INITIAL_HEALTH - playerHealth : 0,
            weaponId: currentWeapon.id,
          })
        }).catch(() => {}); // fire and forget
      }
    }
  }, [playerHealth, opponentHealth]);

  const handleSubmit = async () => {
    if (!userCode.trim()) {
      setError('Please write some code first!');
      return;
    }
    if (!currentWeapon) {
      setError('No weapon selected');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setExecutionResult(null);

    try {
      const response = await fetch('/api/battle/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weaponId: currentWeapon.id,
          userCode: userCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.testResults && data.testResults.length > 0) {
          const syntaxError = data.testResults.find(t =>
            t.error && t.error.toLowerCase().includes('syntax')
          );
          if (syntaxError) {
            throw new Error(`Syntax Error: ${syntaxError.error}`);
          }
        }
        throw new Error(data.error || data.details || `Server error: ${response.status}`);
      }

      setExecutionResult(data);

      if (data.success) {
        if (data.damageDealt > 0) {
          setOpponentHealth(prev => {
            const newHealth = Math.max(0, prev - data.damageDealt);
            return newHealth;
          });
          setBattleLog(prev => [...prev, {
            round: roundNumber,
            message: `⚔️ Round ${roundNumber}: You dealt ${data.damageDealt} damage! (${data.passedTests}/${data.totalTests} tests passed)`,
            type: 'hit'
          }]);
        } else if (data.passedTests === 0 && !data.error) {
          const penalty = 10;
          setPlayerHealth(prev => Math.max(0, prev - penalty));
          setBattleLog(prev => [...prev, {
            round: roundNumber,
            message: `💥 Round ${roundNumber}: Code compiled but all tests failed. You take ${penalty} damage!`,
            type: 'miss'
          }]);
        }

        // AI counter-attack (random damage based on round)
        if (data.damageDealt < 50) {
          const aiDmg = Math.floor(Math.random() * 15) + 5;
          setTimeout(() => {
            setPlayerHealth(prev => Math.max(0, prev - aiDmg));
            setBattleLog(prev => [...prev, {
              round: roundNumber,
              message: `🤖 AI counter-attacks for ${aiDmg} damage!`,
              type: 'ai'
            }]);
          }, 500);
        }

        setRoundNumber(prev => prev + 1);
      } else {
        setError("The Judge is recharging (API Error). Try again in 5 seconds.");
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
  };

  if (isLoadingWeapon) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
        <span className="text-cyan-400 font-mono text-sm">Loading weapon systems...</span>
      </div>
    );
  }

  if (!currentWeapon) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6">
        <Swords className="w-16 h-16 text-red-400" />
        <h2 className="text-red-400 font-mono text-xl">NO WEAPON EQUIPPED</h2>
        <p className="text-gray-400 font-mono text-sm">Visit the arsenal to select a weapon first.</p>
        <button
          onClick={() => router.push('/arsenal')}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl transition-colors font-mono"
        >
          GO TO ARSENAL
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-red-500 font-mono flex items-center gap-3">
              <Zap className="w-10 h-10" />
              COMBAT_ARENA
            </h1>
            <p className="text-gray-400 mt-2 font-mono text-sm">
              Round {roundNumber} | {userId ? `Player: ${userId.slice(0, 8)}...` : 'Guest Mode'}
            </p>
          </div>
          {battleOver && (
            <button
              onClick={resetBattle}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              NEW BATTLE
            </button>
          )}
        </div>

        {/* Health Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-cyan-400 font-mono font-bold">PLAYER</span>
              <span className={`font-mono font-bold ${
                playerHealth > 50 ? 'text-green-400' :
                playerHealth > 25 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {playerHealth} HP
              </span>
            </div>
            <div className="h-8 bg-gray-800 rounded-full overflow-hidden border-2 border-cyan-500/50 relative">
              <div
                className={`h-full transition-all duration-700 ease-out ${
                  playerHealth > 50 ? 'bg-gradient-to-r from-cyan-500 to-blue-500' :
                  playerHealth > 25 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                  'bg-gradient-to-r from-red-500 to-red-700'
                }`}
                style={{ width: `${playerHealth}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                {playerHealth}%
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-red-400 font-mono font-bold">OPPONENT (AI)</span>
              <span className={`font-mono font-bold ${
                opponentHealth > 50 ? 'text-green-400' :
                opponentHealth > 25 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {opponentHealth} HP
              </span>
            </div>
            <div className="h-8 bg-gray-800 rounded-full overflow-hidden border-2 border-red-500/50 relative">
              <div
                className={`h-full transition-all duration-700 ease-out ${
                  opponentHealth > 50 ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                  opponentHealth > 25 ? 'bg-gradient-to-r from-orange-500 to-yellow-500' :
                  'bg-gradient-to-r from-yellow-500 to-green-500'
                }`}
                style={{ width: `${opponentHealth}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                {opponentHealth}%
              </div>
            </div>
          </div>
        </div>

        {/* Current Weapon */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-green-500/50 rounded-xl p-6 mb-6 shadow-lg shadow-green-500/20">
          <h2 className="text-2xl font-bold text-green-400 flex items-center gap-2 mb-2">
            <Code className="w-6 h-6" />
            {currentWeapon.name}
          </h2>
          <span className="text-sm text-gray-400 font-mono">
            {currentWeapon.challenge_type || 'General'} | Base Damage: {currentWeapon.damage} | Function: <span className="text-cyan-400">{currentWeapon.function_name || 'solve'}()</span>
          </span>
          <div className="bg-black/30 border border-green-500/20 rounded-lg p-4 mt-4">
            <p className="text-gray-300 leading-relaxed">{currentWeapon.challenge_code || 'No challenge description available.'}</p>
          </div>
        </div>

        {/* Code Editor */}
        <div className="space-y-3 mb-6">
          <label className="block text-cyan-400 font-mono text-sm font-bold flex items-center gap-2">
            <Code className="w-4 h-4" />
            YOUR CODE:
          </label>
          <textarea
            value={userCode}
            onChange={(e) => setUserCode(e.target.value)}
            placeholder={`function ${currentWeapon.function_name || 'solve'}(...args) {\n  // Write your solution here\n}`}
            className="w-full h-64 bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-xl border-2 border-gray-700 focus:border-cyan-500 focus:outline-none resize-none shadow-inner"
            spellCheck="false"
            disabled={isSubmitting || battleOver}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !userCode.trim() || battleOver}
            className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                EXECUTING CODE...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                SUBMIT & ATTACK
              </>
            )}
          </button>

          <button
            onClick={resetBattle}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-8 rounded-xl transition-colors"
          >
            RESET
          </button>
        </div>

        {/* Battle Log */}
        {battleLog.length > 0 && (
          <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-4 mb-6 max-h-40 overflow-y-auto">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Battle Log</h4>
            {battleLog.map((log, idx) => (
              <div key={idx} className={`text-sm font-mono py-1 ${
                log.type === 'victory' ? 'text-green-400 font-bold' :
                log.type === 'defeat' ? 'text-red-400 font-bold' :
                log.type === 'hit' ? 'text-cyan-400' :
                log.type === 'ai' ? 'text-orange-400' :
                'text-yellow-400'
              }`}>
                {log.message}
              </div>
            ))}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border-2 border-red-500 text-red-400 p-4 rounded-xl mb-6">
            <div className="flex items-start gap-2">
              <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Error:</strong>
                <pre className="mt-2 text-sm whitespace-pre-wrap font-mono">{error}</pre>
              </div>
            </div>
          </div>
        )}

        {/* Execution Results */}
        {executionResult && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-cyan-500/50 rounded-xl p-6 space-y-4 shadow-lg shadow-cyan-500/20">
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-4">
              <h3 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                EXECUTION RESULTS
              </h3>
              <div className="text-right">
                <div className="text-sm text-gray-400 font-mono">Tests Passed</div>
                <div className="text-2xl font-bold">
                  <span className="text-green-400">{executionResult.passedTests}</span>
                  <span className="text-gray-500"> / </span>
                  <span className="text-gray-400">{executionResult.totalTests}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border-2 border-red-500/50 rounded-lg p-6 text-center">
              <div className="text-sm text-gray-400 mb-2 font-mono">DAMAGE DEALT</div>
              <div className="text-5xl font-bold text-red-400 mb-2">
                {executionResult.damageDealt}
                <span className="text-2xl ml-2">HP</span>
              </div>
              <div className="text-sm text-gray-500 font-mono">
                {executionResult.passPercentage}% accuracy
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Test Cases:</h4>
              {executionResult.testResults && executionResult.testResults.map((test, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    test.passed
                      ? 'bg-green-500/10 border-green-500/50'
                      : 'bg-red-500/10 border-red-500/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {test.passed ? (
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className={`font-mono text-sm font-bold mb-1 ${
                        test.passed ? 'text-green-400' : 'text-red-400'
                      }`}>
                        Test {test.testNumber}: {test.description}
                      </div>
                      <div className="text-xs font-mono text-gray-500 space-y-1">
                        <div>Input: <span className="text-gray-400">{JSON.stringify(test.input)}</span></div>
                        <div>Expected: <span className="text-gray-400">{JSON.stringify(test.expected)}</span></div>
                        {test.actual !== null && test.actual !== undefined && (
                          <div>Got: <span className={test.passed ? 'text-green-400' : 'text-red-400'}>
                            {JSON.stringify(test.actual)}
                          </span></div>
                        )}
                      </div>
                      {test.error && (
                        <div className="mt-2 text-xs text-red-400 bg-red-500/10 p-2 rounded border border-red-500/30 font-mono">
                          {test.error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
