import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET /api/leaderboard — fetch top players
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const period = searchParams.get('period') || 'all'; // 'all' | 'weekly' | 'daily'

    // Base query — top players by ELO
    let query = supabase
      .from('profiles')
      .select('id, username, avatar_url, elo_rating, xp, wins, losses, total_matches, kill_streak, best_streak, rank_title, created_at')
      .order('elo_rating', { ascending: false })
      .limit(limit);

    // For time-filtered leaderboards, filter by created_at of matches
    if (period === 'daily') {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      // Get IDs of players active in the last day
      const { data: activeMatches } = await supabase
        .from('match_history')
        .select('winner_id, loser_id')
        .gte('created_at', dayAgo);

      if (activeMatches && activeMatches.length > 0) {
        const activeIds = [...new Set(activeMatches.flatMap(m => [m.winner_id, m.loser_id]))];
        query = query.in('id', activeIds);
      }
    } else if (period === 'weekly') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: activeMatches } = await supabase
        .from('match_history')
        .select('winner_id, loser_id')
        .gte('created_at', weekAgo);

      if (activeMatches && activeMatches.length > 0) {
        const activeIds = [...new Set(activeMatches.flatMap(m => [m.winner_id, m.loser_id]))];
        query = query.in('id', activeIds);
      }
    }

    const { data: players, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Add rank position
    const ranked = (players || []).map((player, index) => ({
      ...player,
      rank: index + 1,
      winRate: player.total_matches > 0
        ? Math.round((player.wins / player.total_matches) * 100)
        : 0,
    }));

    return NextResponse.json({
      players: ranked,
      total: ranked.length,
      period,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
