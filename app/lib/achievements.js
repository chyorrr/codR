'use client';

/**
 * Achievements.
 *
 * Stored locally alongside the rest of local progress. Each one is a pure
 * predicate over a snapshot of the run + profile, so unlocking is checked in one
 * pass after every match and never drifts out of sync with the stats it reads.
 */

const STORAGE_KEY = 'codR_achievements';

export const ACHIEVEMENTS = [
  {
    id: 'first-blood',
    name: 'First Blood',
    description: 'Win your first match',
    icon: '🩸',
    check: (s) => s.profile.wins >= 1,
  },
  {
    id: 'flawless',
    name: 'Flawless',
    description: 'Win a fight without taking any damage',
    icon: '💎',
    // Time Attack has no opponent, so surviving at full HP there is not an
    // achievement — it is the only possible outcome.
    check: (s) => s.won && s.playerHealth === 100 && s.gameMode !== 'time_attack',
  },
  {
    id: 'speedrun',
    name: 'Speedrun',
    description: 'Win with more than half the clock left',
    icon: '⚡',
    check: (s) => s.won && s.timeRemaining > s.matchTime / 2,
  },
  {
    id: 'combo-3',
    name: 'On A Roll',
    description: 'Chain 3 perfect solves in one match',
    icon: '🔗',
    check: (s) => s.maxCombo >= 3,
  },
  {
    id: 'combo-5',
    name: 'Unstoppable',
    description: 'Chain 5 perfect solves in one match',
    icon: '🌀',
    check: (s) => s.maxCombo >= 5,
  },
  {
    id: 'giant-slayer',
    name: 'Giant Slayer',
    description: 'Beat a NIGHTMARE opponent',
    icon: '🐉',
    check: (s) => s.won && s.difficulty === 'nightmare',
  },
  {
    id: 'clutch',
    name: 'Clutch',
    description: 'Win with 10 HP or less remaining',
    icon: '🫀',
    check: (s) => s.won && s.playerHealth > 0 && s.playerHealth <= 10 && s.gameMode !== 'time_attack',
  },
  {
    id: 'streak-3',
    name: 'Hat Trick',
    description: 'Win 3 matches in a row',
    icon: '🔥',
    check: (s) => s.profile.kill_streak >= 3,
  },
  {
    id: 'streak-10',
    name: 'Reign Of Terror',
    description: 'Win 10 matches in a row',
    icon: '👑',
    check: (s) => s.profile.kill_streak >= 10,
  },
  {
    id: 'veteran-10',
    name: 'Veteran',
    description: 'Play 10 matches',
    icon: '🎖️',
    check: (s) => s.profile.total_matches >= 10,
  },
  {
    id: 'expert-kill',
    name: 'Heavy Ordnance',
    description: 'Land a perfect solve with an EXPERT weapon',
    icon: '☢️',
    check: (s) => s.perfectDifficulties.includes('expert'),
  },
  {
    id: 'polyglot',
    name: 'Polyglot',
    description: 'Solve 8 different challenges',
    icon: '🧠',
    check: (s) => s.solvedWeaponIds.length >= 8,
  },
  {
    id: 'gold-rank',
    name: 'Gold Standard',
    description: 'Reach Gold rank or higher',
    icon: '🏅',
    check: (s) => s.profile.elo_rating >= 1400,
  },
  {
    id: 'no-hints',
    name: 'Self Taught',
    description: 'Win a match without opening a hint',
    icon: '📕',
    check: (s) => s.won && !s.usedHint,
  },
];

export const ACHIEVEMENTS_BY_ID = ACHIEVEMENTS.reduce((acc, a) => {
  acc[a.id] = a;
  return acc;
}, {});

function read() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function write(value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* storage full or unavailable — achievements are cosmetic */
  }
}

/** All unlocked ids mapped to their unlock timestamp. */
export function getUnlocked() {
  return read();
}

export function isUnlocked(id) {
  return Boolean(read()[id]);
}

/**
 * Evaluates every achievement against a finished match and returns only the
 * ones newly earned, so the UI can announce them.
 */
export function evaluateAchievements(snapshot) {
  const unlocked = read();
  const earned = [];

  for (const achievement of ACHIEVEMENTS) {
    if (unlocked[achievement.id]) continue;
    let passed = false;
    try {
      passed = Boolean(achievement.check(snapshot));
    } catch {
      passed = false;
    }
    if (passed) {
      unlocked[achievement.id] = new Date().toISOString();
      earned.push(achievement);
    }
  }

  if (earned.length > 0) write(unlocked);
  return earned;
}

export function resetAchievements() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
