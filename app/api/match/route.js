import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { safeQuery, safeWrite } from '../../lib/supabaseServer';
import { levelFromXp } from '../../lib/weapons';

export const dynamic = 'force-dynamic';

const K_FACTOR = 32;

function expectedScore(playerElo, opponentElo) {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
}

function applyElo(playerElo, opponentElo, won) {
  const next = Math.round(playerElo + K_FACTOR * ((won ? 1 : 0) - expectedScore(playerElo, opponentElo)));
  const floored = Math.max(100, next);
  return { newElo: floored, delta: floored - playerElo };
}

function getRankTitle(elo) {
  if (elo >= 2400) return 'Grandmaster';
  if (elo >= 2000) return 'Master';
  if (elo >= 1800) return 'Diamond';
  if (elo >= 1600) return 'Platinum';
  if (elo >= 1400) return 'Gold';
  if (elo >= 1200) return 'Silver';
  if (elo >= 1000) return 'Bronze';
  return 'Recruit';
}

/**
 * POST /api/match — record a finished match.
 *
 * Guests are supported on purpose: the response is computed the same way, the
 * client just persists it locally instead. `persisted` tells the caller whether
 * the result made it into the database.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request body' }, { status: 400 });
  }

  const {
    won = false,
    score = 0,
    weaponId = null,
    opponentElo = null,
    difficulty = null,
    gameMode = 'deathmatch',
  } = body || {};

  let user = null;
  try {
    user = await currentUser();
  } catch {
    user = null;
  }

  const enemyElo = clampElo(opponentElo) ?? 1200 + Math.floor(Math.random() * 200);

  // ---- Guest / offline path -------------------------------------------------
  if (!user) {
    const { newElo, delta } = applyElo(1200, enemyElo, won);
    return NextResponse.json({
      success: true,
      persisted: false,
      guest: true,
      won,
      eloDelta: delta,
      newElo,
      xpGain: won ? 25 + Math.floor(score / 10) : 5,
      streak: won ? 1 : 0,
      rankTitle: getRankTitle(newElo),
      level: 0,
    });
  }

  // ---- Signed-in path -------------------------------------------------------
  const rows = await safeQuery(
    (supabase) =>
      supabase
        .from('profiles')
        .select('elo_rating, wins, losses, total_matches, kill_streak, best_streak, xp')
        .eq('id', user.id)
        .limit(1),
    null
  );

  const profile = rows?.[0] || {
    elo_rating: 1200, wins: 0, losses: 0, total_matches: 0, kill_streak: 0, best_streak: 0, xp: 0,
  };

  const { newElo, delta } = applyElo(profile.elo_rating ?? 1200, enemyElo, won);
  const streak = won ? (profile.kill_streak || 0) + 1 : 0;
  const bestStreak = Math.max(profile.best_streak || 0, streak);
  const xpGain = won ? 25 + Math.floor(score / 10) + streak * 2 : 5;
  const newXp = (profile.xp || 0) + xpGain;
  const rankTitle = getRankTitle(newElo);

  const profileWrite = await safeWrite((supabase) =>
    supabase
      .from('profiles')
      .update({
        elo_rating: newElo,
        wins: (profile.wins || 0) + (won ? 1 : 0),
        losses: (profile.losses || 0) + (won ? 0 : 1),
        total_matches: (profile.total_matches || 0) + 1,
        kill_streak: streak,
        best_streak: bestStreak,
        rank_title: rankTitle,
        xp: newXp,
      })
      .eq('id', user.id)
  );

  if (profileWrite.ok) {
    await safeWrite((supabase) =>
      supabase.from('match_history').insert({
        winner_id: won ? user.id : null,
        loser_id: won ? null : user.id,
        winner_score: won ? score : 0,
        loser_score: won ? 0 : score,
        winner_elo_delta: won ? delta : 0,
        loser_elo_delta: won ? 0 : delta,
        weapon_used: weaponId,
        game_mode: gameMode,
        difficulty,
      })
    );
  }

  return NextResponse.json({
    success: true,
    persisted: profileWrite.ok,
    guest: false,
    won,
    eloDelta: delta,
    newElo,
    xpGain,
    streak,
    rankTitle,
    level: levelFromXp(newXp),
  });
}

function clampElo(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(3000, Math.max(100, Math.round(n)));
}

/** GET /api/match — recent history for the signed-in player. */
export async function GET(request) {
  let user = null;
  try {
    user = await currentUser();
  } catch {
    user = null;
  }

  if (!user) {
    return NextResponse.json({ matches: [], guest: true });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 50);

  const matches = await safeQuery(
    (supabase) =>
      supabase
        .from('match_history')
        .select('*')
        .or(`winner_id.eq.${user.id},loser_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(limit),
    []
  );

  return NextResponse.json({
    matches: (matches || []).map((m) => ({ ...m, won: m.winner_id === user.id })),
    guest: false,
  });
}
