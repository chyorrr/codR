export const metadata = {
  title: 'Challenge a Player',
  description: 'Search the arena roster and send a direct challenge to another combatant.',
  alternates: { canonical: '/request' },
  openGraph: {
    title: 'codR — Challenge a Player',
    description: 'Search the roster and call someone out.',
    url: '/request',
  },
};

export default function RequestLayout({ children }) {
  return children;
}
