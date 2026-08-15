# codR — The Gamified Coding Battle Arena

codR is a browser game where you fight 1v1 coding battles. Solve algorithm challenges to deal damage, survive the clock, climb the ELO ladder. Fast, correct code wins.

**Play instantly against the computer — no account, no database, no setup.**

---

## Quick start

```bash
npm install
```

```bash
npm run dev
```

Open <http://localhost:3000> and hit **PLAY VS COMPUTER**. That's the whole setup — the arena ships with its own challenge catalog and saves progress locally, so it is fully playable with no environment variables at all.

---

## Core features

- **Play vs Computer.** Four AI difficulty tiers — Rookie, Veteran, Elite, Nightmare — each with its own solve speed, accuracy and damage range. The bot works on a visible progress bar: you are racing something real, not a random number generator.
- **14 real coding challenges.** From `sumArray` and FizzBuzz up to Levenshtein edit distance and coin change. Every one has a full test suite, hints, and a damage rating tied to its difficulty.
- **Sandboxed judge.** Your code compiles once inside a locked-down Node `vm` context with no host globals (no `require`, `process`, `fetch` or timers), then each test case runs against it with a per-test timeout.
- **Combat maths that reward good play.** Damage scales with tests passed and the weapon's rating, plus bonuses for solving fast, solving first try, and chaining perfect solves into a combo.
- **ELO, XP and levels.** Wins and losses move your rating, XP unlocks higher weapon tiers, and rank titles run Recruit → Grandmaster.
- **Works offline.** Weapons, leaderboard, matches and profile all degrade to local data when the database is unreachable, and say so plainly in the UI.

---

## Architecture

### Local-first, database-optional

The game's source of truth is [`app/lib/weapons.js`](app/lib/weapons.js) — a bundled catalog of playable challenges. Supabase, when reachable, is merged *on top* of that catalog; it is never required.

```
app/lib/weapons.js      Challenge catalog (bundled, authoritative)
app/lib/gameStore.js    localStorage progress: ELO, XP, streaks, match history
app/lib/bot.js          AI opponent — difficulty profiles, solve timing, taunts
app/lib/roster.js       Standing opponent roster (server + client safe)
app/lib/settings.js     Settings provider — persists and applies preferences
app/lib/sfx.js          WebAudio sound effects, zero assets
app/lib/supabaseServer.js  Best-effort DB access with a circuit breaker
```

Every server route calls the database through `safeQuery` / `safeWrite`. If the host is unreachable, a circuit breaker opens for 60 seconds so requests stop paying a DNS timeout, and the route serves local data instead. Responses carry a `source` or `persisted` field so the UI can tell the player the truth.

### Gameplay loop

1. **Arsenal** — browse weapons, see stats and a challenge preview. Locked weapons show the level they unlock at.
2. **Matchmaking** — choose *Play vs Computer* (instant) or *Find Opponent* (network scan). Pick difficulty and round length.
3. **Combat** — read the challenge, write the function, `Ctrl`/`Cmd`+`Enter` to submit. Passing tests damages the opponent; the bot damages you on its own clock.
4. **Aftermath** — ELO, XP and streak are applied. Progress saves locally, and syncs to the database when one is connected.

---

## Connecting a database (optional)

The app runs without this. To persist profiles and a global leaderboard, create a Supabase project and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<clerk publishable key>
CLERK_SECRET_KEY=<clerk secret key>
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

Expected tables: `profiles`, `weapons`, `user_weapons`, `match_history`. Rows in `weapons` are merged over the bundled catalog by `id`, then by `name` — a DB row missing test cases will not break the local challenge it matches.

> **Note:** the Supabase project referenced by the current local `.env` no longer resolves (its hostname fails DNS). That is why everything above is built to work without it — point the variables at a live project to re-enable cloud sync. See `.env.example`.

---

## Tech stack

- **Framework:** Next.js 15 (App Router)
- **Auth:** Clerk (optional — guests can play)
- **Database:** Supabase / PostgreSQL (optional)
- **Styling:** Tailwind CSS v4
- **Animation:** Framer Motion
- **Execution:** Node.js `vm`

---

## SEO

- Per-route metadata, canonical URLs, and OpenGraph/Twitter cards
- `VideoGame` + `WebSite` JSON-LD structured data
- Generated `sitemap.xml`, `robots.txt`, and web app manifest
- Build-time generated social preview image (`app/opengraph-image.js`)
- Private surfaces (`/profile`, `/settings`, `/combat`) marked `noindex`

---

## Scripts

```bash
npm run dev     # development server (turbopack)
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```
