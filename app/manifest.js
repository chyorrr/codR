export default function manifest() {
  return {
    name: 'codR — Gamified Coding Battle Arena',
    short_name: 'codR',
    description:
      'Fight 1v1 coding battles against AI opponents. Solve algorithm challenges to deal damage and climb the ELO leaderboard.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    orientation: 'any',
    categories: ['games', 'education', 'developer'],
    icons: [
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
    ],
  };
}
