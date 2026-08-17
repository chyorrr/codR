'use client';

/**
 * Local-first game state.
 *
 * codR must be fully playable with no database and no account, so every stat the
 * arena needs lives in localStorage first. When Supabase is reachable the server
 * routes mirror the same numbers — this is the floor, not a replacement.
 */

import { levelFromXp } from './weapons';

const PROFILE_KEY = 'codR_local_profile';
const MATCHES_KEY = 'codR_local_matches';
const SOLVED_KEY = 'codR_solved_weapons';
const MAX_STORED_MATCHES = 50;

export const DEFAULT_PROFILE = {
  username: 'Recruit',
  bio: '',
  elo_rating: 1200,
  xp: 0,
  wins: 0,
  losses: 0,
  total_matches: 0,
  kill_streak: 0,
  best_streak: 0,
  rank_title: 'Recruit',
  created_at: null,
  local: true,
};

export function getRankTitle(elo) {
  if (elo >= 2400) return 'Grandmaster';
  if (elo >= 2000) return 'Master';
  if (elo >= 1800) return 'Diamond';
  if (elo >= 1600) return 'Platinum';
  if (elo >= 1400) return 'Gold';
  if (elo >= 1200) return 'Silver';
  if (elo >= 1000) return 'Bronze';
  return 'Recruit';
}

export function calculateElo(playerElo, opponentElo, won, kFactor = 32) {
  const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const next = Math.round(playerElo + kFactor * ((won ? 1 : 0) - expected));
  const floored = Math.max(100, next);
  return { newElo: floored, delta: floored - playerElo };
}

function read(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or private mode — gameplay continues in memory */
  }
}

export function getLocalProfile() {
  const stored = read(PROFILE_KEY, null);
  if (!stored) {
    const fresh = { ...DEFAULT_PROFILE, created_at: new Date().toISOString() };
    write(PROFILE_KEY, fresh);
    return fresh;
  }
  return { ...DEFAULT_PROFILE, ...stored };
}

export function saveLocalProfile(patch) {
  const next = { ...getLocalProfile(), ...patch };
  write(PROFILE_KEY, next);
  return next;
}

export function getLocalMatches() {
  return read(MATCHES_KEY, []);
}

/**
 * Applies a finished match to the local profile and history.
 * Returns the same shape as POST /api/match so callers can treat both alike.
 */
export function recordLocalMatch({ won, score = 0, weaponId = null, opponent = null, difficulty = null, gameMode = 'deathmatch' }) {
  const profile = getLocalProfile();
  const opponentElo = opponent?.elo_rating || 1150 + Math.floor(Math.random() * 250);

  const { newElo, delta } = calculateElo(profile.elo_rating, opponentElo, won);
  const streak = won ? profile.kill_streak + 1 : 0;
  const bestStreak = Math.max(profile.best_streak, streak);
  const xpGain = won ? 25 + Math.floor(score / 10) + streak * 2 : 5;
  const rankTitle = getRankTitle(newElo);

  const updated = saveLocalProfile({
    elo_rating: newElo,
    wins: profile.wins + (won ? 1 : 0),
    losses: profile.losses + (won ? 0 : 1),
    total_matches: profile.total_matches + 1,
    kill_streak: streak,
    best_streak: bestStreak,
    xp: profile.xp + xpGain,
    rank_title: rankTitle,
  });

  const match = {
    id: `local-${Date.now()}`,
    won,
    score,
    weapon_used: weaponId,
    game_mode: gameMode,
    difficulty,
    opponent: opponent?.username || 'AI OPPONENT',
    elo_delta: delta,
    created_at: new Date().toISOString(),
  };
  write(MATCHES_KEY, [match, ...getLocalMatches()].slice(0, MAX_STORED_MATCHES));

  return {
    success: true,
    local: true,
    won,
    score,
    eloDelta: delta,
    newElo,
    xpGain,
    streak,
    rankTitle,
    level: levelFromXp(updated.xp),
    profile: updated,
  };
}

/** Distinct challenges the player has ever fully solved — drives progression goals. */
export function getSolvedWeaponIds() {
  return read(SOLVED_KEY, []);
}

export function recordSolvedWeapon(weaponId) {
  if (!weaponId) return getSolvedWeaponIds();
  const solved = getSolvedWeaponIds();
  if (solved.includes(weaponId)) return solved;
  const next = [...solved, weaponId];
  write(SOLVED_KEY, next);
  return next;
}

export function resetLocalProgress() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PROFILE_KEY);
    window.localStorage.removeItem(MATCHES_KEY);
    window.localStorage.removeItem(SOLVED_KEY);
  } catch {
    /* ignore */
  }
}
