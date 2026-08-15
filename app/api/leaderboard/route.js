import { NextResponse } from 'next/server';
import { safeQuery } from '../../lib/supabaseServer';
import { botRoster } from '../../lib/roster';

export const dynamic = 'force-dynamic';

const PROFILE_COLUMNS =
  'id, username, avatar_url, elo_rating, xp, wins, losses, total_matches, kill_streak, best_streak, rank_title, created_at';

/**
 * GET /api/leaderboard
 *
 * Real profiles when the database answers, the standing arena roster otherwise —
 * the board is never blank, and `source` says which you are looking at.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 100);
  const period = searchParams.get('period') || 'all';

  const activeIds = await activePlayerIds(period);

  const players = await safeQuery((supabase) => {
    let query = supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .order('elo_rating', { ascending: false })
      .limit(limit);
    if (activeIds && activeIds.length > 0) query = query.in('id', activeIds);
    return query;
  }, null);

  const usingFallback = !players || players.length === 0;
  const source = usingFallback ? botRoster(limit) : players;

  const ranked = source
    .slice(0, limit)
    .map((player, index) => ({
      ...player,
      rank: index + 1,
      winRate:
        player.winRate ??
        (player.total_matches > 0 ? Math.round((player.wins / player.total_matches) * 100) : 0),
    }));

  return NextResponse.json({
    players: ranked,
    total: ranked.length,
    period,
    source: usingFallback ? 'roster' : 'database',
  });
}

/** Player ids seen in match history for the requested window. */
async function activePlayerIds(period) {
  if (period !== 'daily' && period !== 'weekly') return null;

  const windowMs = period === 'daily' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  const since = new Date(Date.now() - windowMs).toISOString();

  const matches = await safeQuery(
    (supabase) => supabase.from('match_history').select('winner_id, loser_id').gte('created_at', since),
    null
  );

  if (!matches || matches.length === 0) return null;
  return [...new Set(matches.flatMap((m) => [m.winner_id, m.loser_id]).filter(Boolean))];
}
