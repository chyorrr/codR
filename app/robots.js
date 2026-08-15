import { SITE_URL } from './lib/site';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Private surfaces and endpoints — nothing indexable behind these.
        disallow: ['/api/', '/settings', '/profile', '/combat'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
