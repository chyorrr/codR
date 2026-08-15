/**
 * Shared (server + client safe) opponent roster.
 *
 * Keeps the leaderboard and player search populated when there is no database,
 * so those pages demo correctly instead of rendering an empty state.
 */

export const BOT_NAMES = [
  'null_pointer', 'seg_fault', 'race_condition', 'stack_overflow', 'dev_rage',
  'byte_hunter', 'syntax_slayer', 'code_ninja', 'heap_wraith', 'off_by_one',
  'kernel_panic', 'infinite_loop', 'dangling_ref', 'zero_cool',
];

export function rankForElo(elo) {
  if (elo >= 2400) return 'Grandmaster';
  if (elo >= 2000) return 'Master';
  if (elo >= 1800) return 'Diamond';
  if (elo >= 1600) return 'Platinum';
  if (elo >= 1400) return 'Gold';
  if (elo >= 1200) return 'Silver';
  if (elo >= 1000) return 'Bronze';
  return 'Recruit';
}

/** Deterministic so rankings stay stable between requests and renders. */
export function botRoster(count = 14) {
  return BOT_NAMES.slice(0, count).map((username, i) => {
    const elo = 2450 - i * 97;
    const wins = 320 - i * 18;
    const losses = 40 + i * 11;
    return {
      id: `bot-${username}`,
      username,
      avatar_url: null,
      elo_rating: elo,
      xp: elo * 3,
      wins,
      losses,
      total_matches: wins + losses,
      kill_streak: Math.max(0, 14 - i),
      best_streak: Math.max(1, 30 - i * 2),
      rank_title: rankForElo(elo),
      bio: 'Arena regular.',
      isBot: true,
      winRate: Math.round((wins / (wins + losses)) * 100),
    };
  });
}
