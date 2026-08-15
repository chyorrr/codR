export const metadata = {
  title: 'Leaderboard — Global ELO Rankings',
  description:
    'The codR global rankings. Track ELO ratings, win rates and kill streaks across every combatant in the arena.',
  alternates: { canonical: '/leaderboard' },
  openGraph: {
    title: 'codR Leaderboard — Global ELO Rankings',
    description: 'See who tops the arena: ELO, win rate and streaks for every combatant.',
    url: '/leaderboard',
  },
};

export default function LeaderboardLayout({ children }) {
  return children;
}
