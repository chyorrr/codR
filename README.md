# codR — The Gamified Coding Battle Arena ⚔️

codR is a high-octane, gamified coding platform where developers compete in real-time battles. Fast algorithms, correct logic, and raw speed decide who survives. Solve algorithm challenges to deal damage to opponents, climb the global ELO leaderboard, and earn the title of Grandmaster.

![codR Arena](https://via.placeholder.com/1200x600/000000/22C55E?text=codR+--+GAMIFIED+CODING+ARENA) *

## 🚀 Core Features

- **Live PvP Combat:** Engage in 1v1 algorithmic deathmatches. Every passing test case deals damage to the enemy. Fail tests, and your health drops.
- **Weapon Arsenal:** Code challenges are "weapons" (e.g., *RUST_SNIPER*, *PYTHON_RAILGUN*, *JS_SHOTGUN*). Each weapon has different damage potentials, test cases, and difficulty levels. 
- **Sandboxed Execution Engine:** Code is securely executed on the backend within a fully isolated Node.js Virtual Machine (`vm`) sandbox ensuring maximum server security and preventing malicious execution.
- **Dynamic Leaderboards & ELO:** A competitive ranking system that evaluates your battle history, calculates ELO shifts post-match, and adjusts your title from *Recruit* to *Grandmaster*.
- **Sync Architecture:** Clerk handles robust user authentication, while a custom `useSyncUser` webhook automatically synchronizes profiles to a heavily guarded Supabase Postgres Database via Row Level Security (RLS).
- **Cinematic UX:** Built with Framer Motion and an aggressive terminal/hacker aesthetic to make coding feel like a high-stakes cyber operation.

## ⚙️ How It Works (The Gameplay Loop)

1. **Authentication:** Sign in via passwordless email or OAuth (GitHub/Google) powered by Clerk.
2. **The Arsenal:** Visit the Arsenal to browse your unlocked weapons. Select a weapon based on difficulty and damage output to "equip" it for battle.
3. **Matchmaking:** Head to the Arena. The system scans the network for opponents in your skill bracket. 
4. **Combat Phase:** You are given the challenge prompt for your equipped weapon and an embedded code editor. 
   - Hitting "SUBMIT & ATTACK" runs your code in the sandboxed Judge.
   - Passing tests deals damage. 
   - Failing tests, or failing to write optimal code before the round timer ends causes you to take damage.
5. **Aftermath:** The match concludes when health drops to zero or the clock runs out. Match records are generated, ELO is adjusted, and the Global Leaderboard updates in real-time.

## 🛠️ The Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Authentication:** [Clerk](https://clerk.com/)
- **Database / Realtime Backend:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Code Execution:** Secure Node.js `vm` module


