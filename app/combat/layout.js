export const metadata = {
  title: 'Combat',
  description: 'Live coding battle in progress.',
  // In-match state is per-session; nothing here belongs in an index.
  robots: { index: false, follow: false },
};

export default function CombatLayout({ children }) {
  return children;
}
