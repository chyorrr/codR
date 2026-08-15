import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { safeQuery, safeWrite } from '../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

const MAX_USERNAME = 24;
const MAX_BIO = 200;

function blankProfile(user) {
  return {
    id: user.id,
    username: user.username || user.firstName || 'AnonymousCoder',
    avatar_url: user.imageUrl || '',
    bio: '',
    elo_rating: 1200,
    xp: 0,
    wins: 0,
    losses: 0,
    total_matches: 0,
    kill_streak: 0,
    best_streak: 0,
    rank_title: 'Recruit',
    created_at: new Date().toISOString(),
  };
}

/** GET /api/profile — the signed-in player's profile, weapons and recent matches. */
export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const rows = await safeQuery(
    (supabase) => supabase.from('profiles').select('*').eq('id', user.id).limit(1),
    null
  );

  // No database, or no row yet — hand back a usable profile either way.
  if (!rows || rows.length === 0) {
    const fresh = blankProfile(user);
    const created = await safeWrite((supabase) =>
      supabase.from('profiles').upsert(fresh, { onConflict: 'id' }).select().single()
    );

    return NextResponse.json({
      profile: created.ok ? created.data : fresh,
      weapons: [],
      recentMatches: [],
      persisted: created.ok,
    });
  }

  const [weapons, recentMatches] = await Promise.all([
    safeQuery(
      (supabase) => supabase.from('user_weapons').select('*, weapons(*)').eq('profile_id', user.id),
      []
    ),
    safeQuery(
      (supabase) =>
        supabase
          .from('match_history')
          .select('*')
          .or(`winner_id.eq.${user.id},loser_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(10),
      []
    ),
  ]);

  return NextResponse.json({
    profile: rows[0],
    weapons: weapons || [],
    recentMatches: recentMatches || [],
    persisted: true,
  });
}

/** PUT /api/profile — update username / bio. */
export async function PUT(request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request body' }, { status: 400 });
  }

  const updates = {};

  if (body.username !== undefined) {
    const username = String(body.username).trim();
    if (username.length < 2 || username.length > MAX_USERNAME) {
      return NextResponse.json(
        { error: `Username must be between 2 and ${MAX_USERNAME} characters.` },
        { status: 400 }
      );
    }
    if (!/^[\w.-]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Username may only contain letters, numbers, dots, dashes and underscores.' },
        { status: 400 }
      );
    }
    updates.username = username;
  }

  if (body.bio !== undefined) {
    const bio = String(body.bio).trim();
    if (bio.length > MAX_BIO) {
      return NextResponse.json({ error: `Bio must be ${MAX_BIO} characters or fewer.` }, { status: 400 });
    }
    updates.bio = bio;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const result = await safeWrite((supabase) =>
    supabase.from('profiles').update(updates).eq('id', user.id).select().single()
  );

  if (!result.ok) {
    if (/duplicate key|23505/i.test(result.reason || '')) {
      return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 });
    }
    if (result.reason === 'unavailable') {
      return NextResponse.json(
        { error: 'Profile service is offline right now. Changes were not saved.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: result.reason || 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ profile: result.data });
}
