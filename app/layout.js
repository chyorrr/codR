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
