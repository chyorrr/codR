import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET /api/profile — fetch current user's profile
export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist yet, create it
      const newProfile = {
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
      };

      const { data: created, error: createError } = await supabase
        .from('profiles')
        .upsert(newProfile, { onConflict: 'id' })
        .select()
        .single();

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }

      return NextResponse.json({ profile: created });
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also fetch match history count and equipped weapons
    const { data: weapons } = await supabase
      .from('user_weapons')
      .select('*, weapons(*)')
      .eq('profile_id', user.id);

    const { data: recentMatches } = await supabase
      .from('match_history')
      .select('*')
      .or(`winner_id.eq.${user.id},loser_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      profile,
      weapons: weapons || [],
      recentMatches: recentMatches || [],
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/profile — update username/bio
export async function PUT(request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { username, bio } = body;

    const updates = {};
    if (username !== undefined) updates.username = username;
    if (bio !== undefined) updates.bio = bio;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
