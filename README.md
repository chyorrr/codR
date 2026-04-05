# codeR

codeR is a gamified coding battle platform built with Next.js (App Router), React 19, TailwindCSS v4, and Framer Motion. The current build already includes a full frontend game loop from landing to battle, with strong visual polish and mock gameplay logic.

## Current Project Status

### What has been implemented

1. Core app setup
- Next.js App Router project structure is configured and running.
- Global auth context provider exists and is wired in the root layout.
- TailwindCSS and animation libraries are integrated.

2. Route flow and screens
- `/` Landing page with advanced animations and interactive UI.
- `/login` Login terminal UI with validation and mock sign-in.
- `/register` Registration UI with validation, password strength meter, and auto sign-in.
- `/arsenal` Weapon selection with category-based loadouts.
- `/matchmaking` Match search simulation with real-opponent mock + AI fallback path.
- `/leaderboard` Leaderboard page with real-time ranking.
- `/combat` Coding battle page with health/score/challenge cycle.
- `/profile` Profile page with user information and stats.
- `/request` Request page with real-time request sending to id to play.

3. Game data and mechanics (frontend/mock)
- Weapon system data loader is implemented in utility modules.
- Coding challenge bank is implemented (easy/medium/hard/expert style difficulty buckets).
- Combat includes timer, test execution simulation, score/damage logic, skip/timeout penalties.
- Session-based flow is implemented via `sessionStorage` for selected weapon/opponent/match config.

4. Authentication state (local-only)
- AuthProvider stores signed-in user in `localStorage`.
- Login/register pages update auth state and redirect back to landing.

## What is missing right now

1. Real backend and persistence
- No database integration for users, match history, ratings, loadouts, or stats.
- No real authentication service (JWT/session/OAuth); current auth is local mock state.
- No server-side APIs for matchmaking, battle, leaderboard, or profile.

2. Real-time multiplayer
- Matchmaking is simulated, not real queue-based multiplayer.
- No WebSocket/WebRTC game state sync between players.
- No anti-cheat or server-authoritative match validation.

3. Secure code execution
- Combat uses client-side function execution for challenge checks.
- No sandboxed runner (container/VM/isolated worker) for safe code execution.

4. Product and platform gaps
- No profile page, settings page, or progression/reward economy.
- No leaderboard page despite game framing around ranking.
- No observability stack (error logging/analytics/monitoring).
- No test suite (unit/integration/e2e).

5. Engineering hygiene gaps
- README and metadata were not project-specific before this update.
- No CI/CD workflows defined.
- No environment-variable template or deployment runbook.

## What can be implemented next (recommended roadmap)

### Phase 1: Make it production-safe
1. Add backend (Next.js route handlers or separate service) + PostgreSQL.
2. Implement real auth (email/password with hashing, session/JWT, protected routes).
3. Move challenge evaluation to a secure server-side sandbox.
4. Add input validation and request rate limiting for API endpoints.

### Phase 2: Core game depth
1. Real matchmaking queue with MMR/ELO and region/ping strategy.
2. Real-time battle state sync via WebSockets.
3. Persistent player profiles, inventory, rank, and match history.
4. Leaderboards (daily/weekly/global) + post-match analytics.

### Phase 3: Quality and scale
1. Add tests (Vitest/Jest + Playwright).
2. Add CI pipeline for lint/test/build checks.
3. Add telemetry (Sentry + analytics).
4. Performance pass (bundle analysis, animation tuning, lazy-loading).

## Known Risks / Technical Notes

1. Current auth and combat logic are client-controlled and can be tampered with.
2. Browser storage is used for critical gameplay state; this is easy to modify.
3. Code execution and scoring must be moved server-side before public release.

## Local Development

### Prerequisites
- Node.js 18+
- npm (or pnpm/yarn)

### Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

### Build and start

```bash
npm run build
npm run start
```

## Current Tech Stack

- Next.js 15 (App Router)
- React 19
- TailwindCSS v4
- Framer Motion
- Lucide React
- GSAP

## High-Level Project Structure

```text
app/
	page.js                 # Landing
	layout.js               # Root layout + AuthProvider
	providers/AuthProvider.jsx
	login/page.js
	register/page.js
	arsenal/page.js
	matchmaking/page.js
	combat/page.js
	components/
		CodrLanding.jsx
		ClientComponents.js
		TargetCursor.jsx
		CodeBackground.jsx
	utils/
		arsenalLoader.js
		codingChallenges.js
```

## Suggested Immediate Action Items

1. Add real API-backed auth and protected route guards.
2. Replace client-side test execution with sandboxed server-side execution.
3. Add a basic leaderboard/profile backend model and endpoints.
4. Add automated tests for auth flow and combat challenge scoring.
