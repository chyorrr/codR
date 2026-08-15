import { SITE_URL } from './lib/site';

/**
 * Only publicly meaningful routes are listed. Personal pages (/profile,
 * /settings) and the in-match view are excluded — they are behind auth or
 * session state and have nothing to index.
 */
export default function sitemap() {
  const lastModified = new Date();

  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/arsenal`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/matchmaking`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/leaderboard`, lastModified, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/request`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
  ];
}
