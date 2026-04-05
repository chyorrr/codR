import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET /api/weapons — fetch all weapons or user's equipped loadout
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const equipped = searchParams.get('equipped') === 'true';
    const category = searchParams.get('category');

    if (equipped) {
      const user = await currentUser();
      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      const { data, error } = await supabase
        .from('user_weapons')
        .select('*, weapons(*)')
        .eq('profile_id', user.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        weapons: (data || []).map(uw => ({
          ...uw.weapons,
          is_equipped: uw.is_equipped,
          user_weapon_id: uw.id,
        })),
      });
    }

    // Fetch all weapons catalog
    let query = supabase.from('weapons').select('*').order('unlock_level', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data: weapons, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ weapons: weapons || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
