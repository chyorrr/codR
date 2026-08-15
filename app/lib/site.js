/**
 * Canonical site constants.
 *
 * Kept out of layout.js because Next type-checks route/layout modules and
 * rejects unexpected named exports from them.
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://codr.vercel.app').replace(/\/$/, '');

export const SITE_NAME = 'codR';

export const SITE_TITLE = 'codR — Gamified Coding Battle Arena';

export const SITE_DESCRIPTION =
  'Fight 1v1 coding battles against AI opponents. Solve algorithm challenges to deal damage, climb the ELO leaderboard, and unlock weapons. Free, no install, playable in your browser.';
