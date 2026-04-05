import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// POST /api/weapons/equip — equip or unequip a weapon
export async function POST(request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { weaponId, equip = true } = body;

    if (!weaponId) {
      return NextResponse.json({ error: 'weaponId is required' }, { status: 400 });
    }

    // Verify weapon exists
    const { data: weapon, error: weaponError } = await supabase
      .from('weapons')
      .select('id, category')
      .eq('id', weaponId)
      .single();

    if (weaponError || !weapon) {
      return NextResponse.json({ error: 'Weapon not found' }, { status: 404 });
    }

    if (equip) {
      // Unequip any currently equipped weapon in the same category
      const { data: currentEquipped } = await supabase
        .from('user_weapons')
        .select('id, weapon_id, weapons(category)')
        .eq('profile_id', user.id)
        .eq('is_equipped', true);

      if (currentEquipped) {
        for (const uw of currentEquipped) {
          if (uw.weapons?.category === weapon.category && uw.weapon_id !== weaponId) {
            await supabase
              .from('user_weapons')
              .update({ is_equipped: false })
              .eq('id', uw.id);
          }
        }
      }

      // Add to inventory if not already there, and equip
      const { error: upsertError } = await supabase
        .from('user_weapons')
        .upsert(
          {
            profile_id: user.id,
            weapon_id: weaponId,
            is_equipped: true,
          },
          { onConflict: 'profile_id,weapon_id' }
        );

      if (upsertError) {
        return NextResponse.json({ error: upsertError.message }, { status: 500 });
      }
    } else {
      // Unequip
      const { error: updateError } = await supabase
        .from('user_weapons')
        .update({ is_equipped: false })
        .eq('profile_id', user.id)
        .eq('weapon_id', weaponId);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, weaponId, equipped: equip });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
