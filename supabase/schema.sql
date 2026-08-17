-- ============================================================================
-- codR — complete database schema
-- ============================================================================
-- Run this whole file once in the Supabase SQL Editor (Dashboard → SQL Editor →
-- New query → paste → Run). It is idempotent: re-running is safe.
--
-- Security model
--   • Reads  (leaderboard, weapons, player search) use the ANON key + RLS.
--   • Writes (profiles, matches, loadouts) happen ONLY in server API routes
--     using the SERVICE ROLE key, which bypasses RLS.
--   That means no client can forge a match result or edit someone else's ELO.
--
-- Required environment variables
--   NEXT_PUBLIC_SUPABASE_URL       Project URL          (Settings → API)
--   NEXT_PUBLIC_SUPABASE_ANON_KEY  anon / public key    (Settings → API)
--   SUPABASE_SERVICE_ROLE_KEY      service_role key     (Settings → API)
--                                  ^ server-only, never prefix with NEXT_PUBLIC_
-- ============================================================================


-- ─────────────────────────────── PROFILES ──────────────────────────────────
-- `id` is the Clerk user id (a string like "user_2ab..."), not a uuid.
create table if not exists public.profiles (
  id            text primary key,
  username      text unique,
  avatar_url    text,
  bio           text default '',
  elo_rating    integer not null default 1200,
  xp            integer not null default 0,
  wins          integer not null default 0,
  losses        integer not null default 0,
  total_matches integer not null default 0,
  kill_streak   integer not null default 0,
  best_streak   integer not null default 0,
  rank_title    text    not null default 'Recruit',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint elo_in_range   check (elo_rating between 100 and 4000),
  constraint counts_natural check (wins >= 0 and losses >= 0 and total_matches >= 0),
  constraint bio_length     check (char_length(bio) <= 200),
  constraint username_shape check (username is null or username ~ '^[A-Za-z0-9_.-]{2,24}$')
);

-- The leaderboard is always "top N by elo"; this makes that a single index scan.
create index if not exists profiles_elo_idx on public.profiles (elo_rating desc);
-- Player search is ILIKE '%q%', which needs a trigram index to stay fast.
-- If your project keeps extensions in a dedicated schema, the equivalent is
--   create extension if not exists pg_trgm with schema extensions;
create extension if not exists pg_trgm;
create index if not exists profiles_username_trgm_idx
  on public.profiles using gin (username gin_trgm_ops);


-- ─────────────────────────────── WEAPONS ───────────────────────────────────
-- Optional. The app ships a built-in catalog (app/lib/weapons.js) and merges
-- these rows on top of it, matching by id first and then by name. A row here
-- can override a built-in weapon's stats or add an entirely new challenge.
--
-- Column names are snake_case; the API maps fire_rate → fireRate,
-- ammo_type → ammoType and weapon_range → range for the UI.
create table if not exists public.weapons (
  id             text primary key,
  name           text not null unique,
  description    text,
  category       text not null default 'Primary'
                 check (category in ('Primary', 'Secondary', 'Special')),
  tier           text not null default 'basic'
                 check (tier in ('basic', 'advanced', 'specialist', 'legendary')),
  difficulty     text not null default 'easy'
                 check (difficulty in ('easy', 'medium', 'hard', 'expert')),
  damage         integer not null default 30 check (damage between 1 and 100),
  speed          integer not null default 50 check (speed between 0 and 100),
  accuracy       integer not null default 50 check (accuracy between 0 and 100),
  fire_rate      text,
  weapon_range   text,
  ammo_type      text,
  specialty      text,
  unlock_level   integer not null default 0 check (unlock_level >= 0),
  challenge_type text,
  challenge_code text,          -- the prompt shown to the player
  function_name  text,          -- the function their solution must define
  starter_code   text,
  hints          jsonb default '[]'::jsonb,
  test_cases     jsonb default '[]'::jsonb,
  created_at     timestamptz not null default now(),

  -- A weapon is only playable if the judge knows what to call and what to check.
  constraint playable check (
    function_name is null
    or (jsonb_typeof(test_cases) = 'array' and jsonb_array_length(test_cases) > 0)
  )
);

create index if not exists weapons_tier_idx     on public.weapons (tier);
create index if not exists weapons_category_idx on public.weapons (category);


-- ───────────────────────────── USER_WEAPONS ────────────────────────────────
-- A player's inventory and which weapon is equipped per category.
create table if not exists public.user_weapons (
  id          uuid primary key default gen_random_uuid(),
  profile_id  text not null references public.profiles(id) on delete cascade,
  weapon_id   text not null references public.weapons(id)  on delete cascade,
  is_equipped boolean not null default false,
  acquired_at timestamptz not null default now(),

  -- /api/weapons/equip upserts on this pair.
  unique (profile_id, weapon_id)
);

create index if not exists user_weapons_profile_idx on public.user_weapons (profile_id);


-- ───────────────────────────── MATCH_HISTORY ───────────────────────────────
-- One row per finished match. For matches against the computer only one side is
-- a real player, so winner_id / loser_id are nullable.
create table if not exists public.match_history (
  id               uuid primary key default gen_random_uuid(),
  winner_id        text references public.profiles(id) on delete set null,
  loser_id         text references public.profiles(id) on delete set null,
  winner_score     integer not null default 0,
  loser_score      integer not null default 0,
  winner_elo_delta integer not null default 0,
  loser_elo_delta  integer not null default 0,
  weapon_used      text,
  game_mode        text not null default 'deathmatch',
  difficulty       text,
  created_at       timestamptz not null default now(),

  constraint has_a_participant check (winner_id is not null or loser_id is not null)
);

create index if not exists match_history_winner_idx  on public.match_history (winner_id, created_at desc);
create index if not exists match_history_loser_idx   on public.match_history (loser_id,  created_at desc);
create index if not exists match_history_created_idx on public.match_history (created_at desc);


-- ────────────────────────── updated_at maintenance ─────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();


-- ═══════════════════════════ ROW LEVEL SECURITY ════════════════════════════
-- Everything is read-only to the anon key. All writes go through server routes
-- holding the service_role key, which bypasses RLS entirely.

alter table public.profiles      enable row level security;
alter table public.weapons       enable row level security;
alter table public.user_weapons  enable row level security;
alter table public.match_history enable row level security;

-- Public reads (leaderboard, player search, weapon catalog, match feed).
drop policy if exists "profiles are publicly readable" on public.profiles;
create policy "profiles are publicly readable"
  on public.profiles for select using (true);

drop policy if exists "weapons are publicly readable" on public.weapons;
create policy "weapons are publicly readable"
  on public.weapons for select using (true);

drop policy if exists "loadouts are publicly readable" on public.user_weapons;
create policy "loadouts are publicly readable"
  on public.user_weapons for select using (true);

drop policy if exists "match history is publicly readable" on public.match_history;
create policy "match history is publicly readable"
  on public.match_history for select using (true);

-- Note: no INSERT / UPDATE / DELETE policies exist on purpose. Without the
-- service_role key nothing can be written, so a leaked anon key cannot be used
-- to inflate a rating or fabricate matches.


-- ═════════════════════════════ OPTIONAL SEED ═══════════════════════════════
-- The app already ships these challenges locally, so seeding is not required.
-- It is useful if you want to edit challenge text or stats from the dashboard.
-- Everything below is a no-op on conflict, so it will not clobber your edits.

insert into public.weapons
  (id, name, description, category, tier, difficulty, damage, speed, accuracy,
   fire_rate, weapon_range, ammo_type, specialty, unlock_level,
   challenge_type, challenge_code, function_name, starter_code, hints, test_cases)
values
  ('js-pistol', 'JS_PISTOL',
   'Reliable sidearm. Sums an array of integers. Every combatant starts here.',
   'Primary', 'basic', 'easy', 30, 92, 88,
   'RAPID', 'SHORT', 'INT32', 'Warm-up', 0,
   'Arrays', 'Return the sum of all numbers in the array. An empty array sums to 0.',
   'sumArray', E'function sumArray(nums) {\n  // your code here\n}',
   '["reduce() is your friend", "Remember the empty-array case"]'::jsonb,
   '[{"input": [[1,2,3]], "expected": 6, "description": "Simple positives"},
     {"input": [[]], "expected": 0, "description": "Empty array"},
     {"input": [[-5,5,10]], "expected": 10, "description": "Mixed signs"},
     {"input": [[100]], "expected": 100, "description": "Single element"}]'::jsonb),

  ('string-shiv', 'STRING_SHIV',
   'Close-quarters blade. Reverses a string character by character.',
   'Secondary', 'basic', 'easy', 30, 96, 90,
   'INSTANT', 'SHORT', 'UTF8', 'Strings', 0,
   'Strings', 'Return the input string reversed.',
   'reverseString', E'function reverseString(str) {\n  // your code here\n}',
   '["split, reverse, join", "Empty string stays empty"]'::jsonb,
   '[{"input": ["hello"], "expected": "olleh", "description": "Basic word"},
     {"input": [""], "expected": "", "description": "Empty string"},
     {"input": ["codR"], "expected": "Rdoc", "description": "Mixed case"},
     {"input": ["racecar"], "expected": "racecar", "description": "Palindrome"}]'::jsonb)
-- Bare `do nothing` (rather than `on conflict (id)`) so a clash on the unique
-- `name` is also skipped instead of aborting the whole script.
on conflict do nothing;


-- ═════════════════════════════ VERIFY ══════════════════════════════════════
-- Expect: profiles 0, weapons 2 (or more), user_weapons 0, match_history 0.
select 'profiles'      as table_name, count(*) from public.profiles
union all select 'weapons',       count(*) from public.weapons
union all select 'user_weapons',  count(*) from public.user_weapons
union all select 'match_history', count(*) from public.match_history;
