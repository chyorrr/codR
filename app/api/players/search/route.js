import { NextResponse } from 'next/server';
import { safeQuery } from '../../../lib/supabaseServer';
import { botRoster } from '../../../lib/roster';

export const dynamic = 'force-dynamic';

/**
 * GET /api/players/search?q= — find opponents by username.
 * Falls back to the arena roster so the challenge page always has targets.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').trim();

  if (query.length < 2) {
    return NextResponse.json({ error: 'Search query must be at least 2 characters', players: [] }, { status: 400 });
  }

  // Escape PostgREST pattern wildcards so a stray % cannot widen the search.
  const pattern = `%${query.replace(/[%_,()]/g, '')}%`;

  const players = await safeQuery(
    (supabase) =>
      supabase
        .from('profiles')
        .select('id, username, avatar_url, elo_rating, rank_title, wins, losses, total_matches')
        .ilike('username', pattern)
        .limit(10),
    null
  );

  if (players && players.length > 0) {
    return NextResponse.json({
      players: players.map((p) => ({
        ...p,
        winRate: p.total_matches > 0 ? Math.round((p.wins / p.total_matches) * 100) : 0,
      })),
      source: 'database',
    });
  }

  const needle = query.toLowerCase();
  const matches = botRoster().filter((p) => p.username.toLowerCase().includes(needle)).slice(0, 10);

  return NextResponse.json({ players: matches, source: 'roster' });
}
