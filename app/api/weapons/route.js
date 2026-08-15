import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { WEAPON_CATALOG } from '../../lib/weapons';
import { getSupabase, safeQuery } from '../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

/**
 * GET /api/weapons
 *
 * The local catalog is always returned. If Supabase is reachable its rows are
 * merged on top (matched by id, then by name) so a live database can extend or
 * override the built-ins without ever being required for the game to work.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const equipped = searchParams.get('equipped') === 'true';
  const category = searchParams.get('category');
  const tier = searchParams.get('tier');

  if (equipped) {
    return getEquippedLoadout();
  }

  const dbWeapons = await safeQuery(
    (supabase) => supabase.from('weapons').select('*'),
    []
  );

  let weapons = mergeCatalog(WEAPON_CATALOG, dbWeapons);

  if (category && category !== 'all') {
    weapons = weapons.filter((w) => w.category === category);
  }
  if (tier && tier !== 'all') {
    weapons = weapons.filter((w) => w.tier === tier);
  }

  weapons.sort((a, b) => (a.unlock_level ?? 0) - (b.unlock_level ?? 0));

  return NextResponse.json({
    weapons,
    source: dbWeapons.length > 0 ? 'database+catalog' : 'catalog',
    total: weapons.length,
  });
}

/** DB rows win on conflicting fields, but never drop a playable local challenge. */
function mergeCatalog(catalog, dbRows) {
  const byId = new Map(catalog.map((w) => [w.id, { ...w }]));
  const byName = new Map(catalog.map((w) => [w.name, w.id]));

  for (const row of dbRows) {
    if (!row) continue;
    const key = byId.has(row.id) ? row.id : byName.get(row.name);

    if (key) {
      const base = byId.get(key);
      byId.set(key, {
        ...base,
        ...stripEmpty(row),
        // A DB row without test cases must not break a playable local weapon.
        test_cases: Array.isArray(row.test_cases) && row.test_cases.length ? row.test_cases : base.test_cases,
        function_name: row.function_name || base.function_name,
        id: base.id,
      });
    } else if (Array.isArray(row.test_cases) && row.test_cases.length && row.function_name) {
      byId.set(row.id, { ...row, tier: row.tier || 'advanced', source: 'database' });
    }
  }

  return [...byId.values()];
}

function stripEmpty(row) {
  return Object.fromEntries(
    Object.entries(row).filter(([, v]) => v !== null && v !== undefined && v !== '')
  );
}

/** Signed-in players get their persisted loadout; everyone else gets the starters. */
async function getEquippedLoadout() {
  let user = null;
  try {
    user = await currentUser();
  } catch {
    user = null;
  }

  const starters = WEAPON_CATALOG.filter((w) => w.unlock_level === 0).map((w, i) => ({
    ...w,
    is_equipped: i === 0,
  }));

  if (!user || !getSupabase()) {
    return NextResponse.json({ weapons: starters, source: 'catalog', authenticated: Boolean(user) });
  }

  const rows = await safeQuery(
    (supabase) => supabase.from('user_weapons').select('*, weapons(*)').eq('profile_id', user.id),
    null
  );

  if (!rows || rows.length === 0) {
    return NextResponse.json({ weapons: starters, source: 'catalog', authenticated: true });
  }

  const catalogById = new Map(WEAPON_CATALOG.map((w) => [w.id, w]));
  const weapons = rows.map((uw) => ({
    ...(catalogById.get(uw.weapon_id) || {}),
    ...(uw.weapons || {}),
    is_equipped: uw.is_equipped,
    user_weapon_id: uw.id,
  }));

  return NextResponse.json({ weapons, source: 'database', authenticated: true });
}
