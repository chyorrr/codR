import { ClerkProvider } from '@clerk/nextjs';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SyncUser from './components/SyncUser';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "codR — Gamified Coding Battle Arena",
  description: "Enter the arena where only the fastest coders survive. 1v1 coding battles with ELO rankings, weapons, and elimination gameplay.",
  keywords: ["coding", "battle", "arena", "programming", "competitive", "deathmatch", "ELO", "leaderboard"],
  authors: [{ name: "codR Arena Systems" }],
  openGraph: {
    title: "codR — Gamified Coding Battle Arena",
    description: "Enter the arena where only the fastest coders survive. 1v1 coding battles with ELO rankings, weapons, and elimination gameplay.",
    type: "website",
    siteName: "codR",
  },
  twitter: {
    card: "summary_large_image",
    title: "codR — Gamified Coding Battle Arena",
    description: "Enter the arena where only the fastest coders survive.",
  },
  metadataBase: new URL("https://codr.vercel.app"),
  themeColor: "#000000",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <SyncUser />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
