import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getWeaponById } from '../../../lib/weapons';
import { safeQuery, safeWrite } from '../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

/**
 * POST /api/weapons/equip — persist a loadout choice.
 *
 * Equipping is a convenience, not a gate: combat reads the selected weapon from
 * the session either way, so a failed write returns 200 with persisted:false
 * rather than blocking the player from playing.
 */
export async function POST(request) {
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

  const { weaponId, equip = true } = body || {};
  if (!weaponId) {
    return NextResponse.json({ error: 'weaponId is required' }, { status: 400 });
  }

  // Local catalog is authoritative; fall back to the DB for custom weapons.
  let weapon = getWeaponById(weaponId);
  if (!weapon) {
    const rows = await safeQuery(
      (supabase) => supabase.from('weapons').select('id, category').eq('id', weaponId).limit(1),
      []
    );
    weapon = rows?.[0] || null;
  }

  if (!weapon) {
    return NextResponse.json({ error: 'Weapon not found' }, { status: 404 });
  }

  if (!equip) {
    const result = await safeWrite((supabase) =>
      supabase
        .from('user_weapons')
        .update({ is_equipped: false })
        .eq('profile_id', user.id)
        .eq('weapon_id', weaponId)
    );
    return NextResponse.json({ success: true, weaponId, equipped: false, persisted: result.ok });
  }

  // One equipped weapon per category.
  const current = await safeQuery(
    (supabase) =>
      supabase
        .from('user_weapons')
        .select('id, weapon_id, weapons(category)')
        .eq('profile_id', user.id)
        .eq('is_equipped', true),
    []
  );

  for (const uw of current || []) {
    const sameCategory = uw.weapons?.category === weapon.category;
    if (sameCategory && uw.weapon_id !== weaponId) {
      await safeWrite((supabase) =>
        supabase.from('user_weapons').update({ is_equipped: false }).eq('id', uw.id)
      );
    }
  }

  const result = await safeWrite((supabase) =>
    supabase
      .from('user_weapons')
      .upsert(
        { profile_id: user.id, weapon_id: weaponId, is_equipped: true },
        { onConflict: 'profile_id,weapon_id' }
      )
  );

  return NextResponse.json({
    success: true,
    weaponId,
    equipped: true,
    persisted: result.ok,
    ...(result.ok ? {} : { note: 'Loadout kept for this session only.' }),
  });
}
