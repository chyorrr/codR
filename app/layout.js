import { ClerkProvider } from '@clerk/nextjs';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import SyncUser from './components/SyncUser';
import { SettingsProvider } from './lib/settings';
import { SITE_URL, SITE_TITLE, SITE_DESCRIPTION } from './lib/site';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

const TITLE = SITE_TITLE;
const DESCRIPTION = SITE_DESCRIPTION;

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: '%s | codR',
  },
  description: DESCRIPTION,
  applicationName: 'codR',
  keywords: [
    'coding game', 'competitive programming', 'coding battle', 'code arena',
    'programming practice', 'algorithm challenges', 'javascript challenges',
    'coding vs computer', 'ELO leaderboard', 'learn to code game', 'codR',
  ],
  authors: [{ name: 'codR Arena Systems' }],
  creator: 'codR Arena Systems',
  publisher: 'codR',
  category: 'games',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'codR',
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: 'Fight 1v1 coding battles against AI opponents. Solve fast, deal damage, climb the leaderboard.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'dark',
};

/** Structured data so search engines understand this is a playable game. */
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'codR',
      description: DESCRIPTION,
      inLanguage: 'en-US',
    },
    {
      '@type': 'VideoGame',
      '@id': `${SITE_URL}/#game`,
      name: 'codR',
      description: DESCRIPTION,
      url: SITE_URL,
      genre: ['Educational', 'Puzzle', 'Competitive'],
      gamePlatform: ['Web Browser'],
      applicationCategory: 'GameApplication',
      operatingSystem: 'Any',
      playMode: ['SinglePlayer'],
      inLanguage: 'en-US',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {/*
            App Router hoists this into the document itself — rendering a manual
            <head> here instead corrupts the document structure.
            The payload is a fixed literal, never user input.
          */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          <SettingsProvider>
            <SyncUser />
            {children}
          </SettingsProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
