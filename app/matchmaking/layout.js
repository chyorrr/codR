export const metadata = {
  title: 'Matchmaking — Play vs the Computer',
  description:
    'Pick a difficulty and deploy instantly against an AI opponent, or scan the arena network for a match. Four bot tiers from Rookie to Nightmare.',
  alternates: { canonical: '/matchmaking' },
  openGraph: {
    title: 'codR Matchmaking — Play vs the Computer',
    description: 'Four AI difficulty tiers, from Rookie to Nightmare. Deploy in one click.',
    url: '/matchmaking',
  },
};

export default function MatchmakingLayout({ children }) {
  return children;
}
