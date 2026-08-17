/**
 * Game modes.
 *
 * These were previously decoration — every mode played identically. Each one now
 * changes a real rule of combat, and the combat page reads these values rather
 * than branching on mode names.
 */

export const GAME_MODES = {
  deathmatch: {
    id: 'deathmatch',
    name: 'Deathmatch',
    description: 'Damage until one side drops',
    tagline: 'Straight fight. First to zero loses.',
    // Multiplier applied to damage you deal.
    damageMultiplier: 1,
    // HP lost when every test fails.
    missPenalty: 8,
    // One failed submission ends the match outright.
    suddenDeath: false,
    // Opponent takes no damage; you race the clock for score instead.
    scoreAttack: false,
    // Each solved challenge shortens the bot's thinking time by this factor.
    botRampPerSolve: 0,
    defaultTime: 120,
  },

  time_attack: {
    id: 'time_attack',
    name: 'Time Attack',
    description: 'Solve as many as you can before the clock',
    tagline: 'No opponent. Just you and the timer.',
    damageMultiplier: 1,
    missPenalty: 0,
    suddenDeath: false,
    scoreAttack: true,
    botRampPerSolve: 0,
    defaultTime: 180,
  },

  sudden_death: {
    id: 'sudden_death',
    name: 'Sudden Death',
    description: 'One failed submission ends it',
    tagline: 'Double damage. Zero margin for error.',
    damageMultiplier: 2,
    missPenalty: 0,       // irrelevant — a miss ends the match
    suddenDeath: true,
    scoreAttack: false,
    botRampPerSolve: 0,
    defaultTime: 120,
  },

  endurance: {
    id: 'endurance',
    name: 'Endurance',
    description: 'Long rounds, the bot speeds up as you solve',
    tagline: 'It gets faster every time you land a hit.',
    damageMultiplier: 1,
    missPenalty: 12,
    suddenDeath: false,
    scoreAttack: false,
    botRampPerSolve: 0.12,  // bot solves 12% faster per challenge you clear
    defaultTime: 300,
  },
};

export const GAME_MODE_LIST = Object.values(GAME_MODES);

export function getGameMode(id) {
  return GAME_MODES[id] || GAME_MODES.deathmatch;
}
