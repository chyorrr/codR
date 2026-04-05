import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Simple ELO calculation
function calculateElo(winnerElo, loserElo, kFactor = 32) {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));

  const newWinnerElo = Math.round(winnerElo + kFactor * (1 - expectedWinner));
  const newLoserElo = Math.round(loserElo + kFactor * (0 - expectedLoser));

  return {
    winnerElo: newWinnerElo,
    loserElo: Math.max(100, newLoserElo), // Floor at 100
    winnerDelta: newWinnerElo - winnerElo,
    loserDelta: newLoserElo - loserElo,
  };
}

// Determine rank title based on ELO
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

// POST /api/match — record a match result
export async function POST(request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { won, score = 0, weaponId = null } = body;

    // Get player profile
    const { data: playerProfile } = await supabase
      .from('profiles')
      .select('elo_rating, wins, losses, total_matches, kill_streak, best_streak')
      .eq('id', user.id)
      .single();

    if (!playerProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // For AI matches, use a simulated opponent ELO
    const aiElo = 1200 + Math.floor(Math.random() * 200);
    const elo = calculateElo(
      won ? playerProfile.elo_rating : aiElo,
      won ? aiElo : playerProfile.elo_rating
    );

    const newStreak = won ? (playerProfile.kill_streak + 1) : 0;
    const bestStreak = Math.max(playerProfile.best_streak, newStreak);

    // XP reward
    const xpGain = won ? (25 + Math.floor(score / 10)) : 5;

    // Update player profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        elo_rating: won ? elo.winnerElo : Math.max(100, playerProfile.elo_rating + elo.loserDelta),
        wins: playerProfile.wins + (won ? 1 : 0),
        losses: playerProfile.losses + (won ? 0 : 1),
        total_matches: playerProfile.total_matches + 1,
        kill_streak: newStreak,
        best_streak: bestStreak,
        rank_title: getRankTitle(won ? elo.winnerElo : Math.max(100, playerProfile.elo_rating + elo.loserDelta)),
        xp: (playerProfile.xp || 0) + xpGain,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[Match] Profile update error:', updateError);
    }

    // Record match history
    const { error: matchError } = await supabase
      .from('match_history')
      .insert({
        winner_id: won ? user.id : null,
        loser_id: won ? null : user.id,
        winner_score: won ? score : 0,
        loser_score: won ? 0 : score,
        winner_elo_delta: won ? elo.winnerDelta : 0,
        loser_elo_delta: won ? 0 : elo.loserDelta,
        weapon_used: weaponId,
        game_mode: 'deathmatch',
      });

    if (matchError) {
      console.error('[Match] History insert error:', matchError);
    }

    return NextResponse.json({
      success: true,
      won,
      eloDelta: won ? elo.winnerDelta : elo.loserDelta,
      newElo: won ? elo.winnerElo : Math.max(100, playerProfile.elo_rating + elo.loserDelta),
      xpGain,
      streak: newStreak,
      rankTitle: getRankTitle(won ? elo.winnerElo : Math.max(100, playerProfile.elo_rating + elo.loserDelta)),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/match — fetch match history for current user
export async function GET(request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    const { data: matches, error } = await supabase
      .from('match_history')
      .select('*')
      .or(`winner_id.eq.${user.id},loser_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      matches: (matches || []).map(m => ({
        ...m,
        won: m.winner_id === user.id,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
