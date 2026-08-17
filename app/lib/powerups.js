'use client';

/**
 * Combat power-ups.
 *
 * Perfect solves earn charge; charge buys a tactical option. This gives the
 * player something to spend a good streak on other than raw damage, and gives
 * a losing player a comeback lever that still requires solving the problem.
 */

import { Snowflake, Eye, Flame, HeartPulse } from 'lucide-react';

export const CHARGE_PER_PERFECT = 34;   // ~3 perfect solves fills the bar
export const MAX_CHARGE = 100;

export const POWERUPS = {
  freeze: {
    id: 'freeze',
    name: 'FREEZE',
    description: 'Stall the opponent for 12 seconds',
    cost: 40,
    icon: Snowflake,
    color: 'text-cyan-400',
    border: 'border-cyan-500/50',
    glow: 'shadow-cyan-500/30',
    duration: 12000,
  },
  insight: {
    id: 'insight',
    name: 'INSIGHT',
    description: 'Reveal a worked hint for this challenge',
    cost: 30,
    icon: Eye,
    color: 'text-yellow-400',
    border: 'border-yellow-500/50',
    glow: 'shadow-yellow-500/30',
  },
  overclock: {
    id: 'overclock',
    name: 'OVERCLOCK',
    description: 'Double damage on your next landed solve',
    cost: 55,
    icon: Flame,
    color: 'text-orange-400',
    border: 'border-orange-500/50',
    glow: 'shadow-orange-500/30',
  },
  patch: {
    id: 'patch',
    name: 'PATCH',
    description: 'Restore 25 HP',
    cost: 45,
    icon: HeartPulse,
    color: 'text-green-400',
    border: 'border-green-500/50',
    glow: 'shadow-green-500/30',
    heal: 25,
  },
};

export const POWERUP_LIST = Object.values(POWERUPS);

export function canAfford(charge, powerupId) {
  const p = POWERUPS[powerupId];
  return Boolean(p) && charge >= p.cost;
}
