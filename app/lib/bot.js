'use client';

/**
 * The computer opponent.
 *
 * A bot "solves" its own challenge on a timer. While it works, its progress bar
 * fills; when it lands, it strikes for damage. Difficulty changes how fast it
 * thinks, how often it flubs a solve, and how hard it hits — so the arena is a
 * real race against something, not a random damage generator.
 */

import { BOT_NAMES, rankForElo } from './roster';

export const BOT_DIFFICULTIES = {
  rookie: {
    id: 'rookie',
    name: 'ROOKIE',
    description: 'Learning the syntax. Gives you room to breathe.',
    solveTime: [38, 62],   // seconds to complete one solve attempt
    successRate: 0.55,     // chance an attempt actually lands
    damage: [8, 14],
    eloBase: 950,
    color: 'text-green-400',
    border: 'border-green-500/40',
    accent: 'bg-green-500',
  },
  veteran: {
    id: 'veteran',
    name: 'VETERAN',
    description: 'Knows the classics. Punishes slow starts.',
    solveTime: [26, 40],
    successRate: 0.72,
    damage: [12, 19],
    eloBase: 1250,
    color: 'text-yellow-400',
    border: 'border-yellow-500/40',
    accent: 'bg-yellow-500',
  },
  elite: {
    id: 'elite',
    name: 'ELITE',
    description: 'Pattern-matches instantly. Very little margin.',
    solveTime: [17, 27],
    successRate: 0.87,
    damage: [16, 24],
    eloBase: 1750,
    color: 'text-orange-400',
    border: 'border-orange-500/40',
    accent: 'bg-orange-500',
  },
  nightmare: {
    id: 'nightmare',
    name: 'NIGHTMARE',
    description: 'Does not miss. Out-code it or die.',
    solveTime: [11, 18],
    successRate: 0.97,
    damage: [20, 30],
    eloBase: 2300,
    color: 'text-red-400',
    border: 'border-red-500/40',
    accent: 'bg-red-500',
  },
};

export const DIFFICULTY_ORDER = ['rookie', 'veteran', 'elite', 'nightmare'];

// Re-exported so client code has a single import for opponent data.
export { botRoster } from './roster';

const BOT_LANGUAGES = [
  ['Rust', 'C++', 'Go'], ['Python', 'JavaScript', 'TypeScript'],
  ['Java', 'Kotlin', 'Scala'], ['C', 'Assembly', 'Zig'], ['Go', 'Elixir', 'Rust'],
];

const BOT_SPECIALTIES = [
  'Algorithm Assassin', 'Systems Architect', 'Low-Level Lunatic',
  'Full-Stack Destroyer', 'Regex Berserker', 'Concurrency Fiend',
];

const BOT_LOCATIONS = [
  'Tokyo, JP', 'Berlin, DE', 'Stockholm, SE', 'Zurich, CH',
  'San Francisco, US', 'Bengaluru, IN', 'São Paulo, BR', 'Seoul, KR',
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const between = ([lo, hi]) => lo + Math.random() * (hi - lo);

/** Chatter shown in the battle log while the bot works. */
export const BOT_TAUNTS = {
  thinking: [
    'parsing the problem...',
    'sketching an approach...',
    'considering edge cases...',
    'reaching for a hash map...',
    'that brute force will not survive the timer.',
    'you are still on line one?',
  ],
  landed: [
    'clean solve. your move.',
    'all tests green. try to keep up.',
    'that is how it is done.',
    'compiled first try.',
    'too easy.',
  ],
  failed: [
    'off by one. recompiling...',
    'edge case bit me. again...',
    'wrong output. rewriting...',
    'null slipped through. patching...',
  ],
  losing: [
    'you are faster than expected.',
    'recalculating...',
    'this is not over.',
  ],
};

/** Builds a fresh opponent for a chosen difficulty. */
export function createBot(difficultyId = 'veteran') {
  const difficulty = BOT_DIFFICULTIES[difficultyId] || BOT_DIFFICULTIES.veteran;
  const wins = 40 + Math.floor(Math.random() * 300);

  return {
    isBot: true,
    difficulty: difficulty.id,
    username: pick(BOT_NAMES),
    rank_title: rankForElo(difficulty.eloBase),
    elo_rating: difficulty.eloBase + Math.floor(Math.random() * 120) - 60,
    languages: pick(BOT_LANGUAGES),
    specialty: pick(BOT_SPECIALTIES),
    location: pick(BOT_LOCATIONS),
    wins,
    losses: Math.floor(wins * (0.25 + Math.random() * 0.5)),
    killStreak: Math.floor(Math.random() * 20),
    avgResponseTime: Number(between(difficulty.solveTime).toFixed(1)),
  };
}

/** Seconds the bot needs for its next solve attempt. */
export function nextSolveTime(difficultyId) {
  const d = BOT_DIFFICULTIES[difficultyId] || BOT_DIFFICULTIES.veteran;
  return between(d.solveTime);
}

/** Resolves one completed bot attempt into damage (0 when it flubs). */
export function resolveBotAttempt(difficultyId) {
  const d = BOT_DIFFICULTIES[difficultyId] || BOT_DIFFICULTIES.veteran;
  const landed = Math.random() < d.successRate;
  return {
    landed,
    damage: landed ? Math.round(between(d.damage)) : 0,
    taunt: pick(landed ? BOT_TAUNTS.landed : BOT_TAUNTS.failed),
  };
}

export function randomThinkingLine() {
  return pick(BOT_TAUNTS.thinking);
}

export function randomLosingLine() {
  return pick(BOT_TAUNTS.losing);
}
