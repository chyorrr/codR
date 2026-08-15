'use client';

/**
 * Zero-asset sound effects.
 *
 * Everything is synthesised with the WebAudio API so there are no files to ship
 * or fail to load. The context is created lazily on the first real gesture,
 * which keeps browser autoplay policies happy.
 */

let ctx = null;
let enabled = false;

function audioContext() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/**
 * The context is intentionally NOT created here — building one before a user
 * gesture leaves it suspended and makes browsers log an autoplay warning. The
 * first actual sound (always triggered by a click) creates it instead.
 */
export function setSoundEnabled(value) {
  enabled = Boolean(value);
}

export function isSoundEnabled() {
  return enabled;
}

/** One synthesised blip. */
function tone({ freq = 440, duration = 0.12, type = 'square', gain = 0.05, sweepTo = null, delay = 0 }) {
  const audio = audioContext();
  if (!audio) return;

  const start = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const amp = audio.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (sweepTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), start + duration);

  // Quick attack, exponential decay — reads as a game blip rather than a beep.
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(amp);
  amp.connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function play(builder) {
  if (!enabled) return;
  try {
    builder();
  } catch {
    /* audio is a nicety, never a failure path */
  }
}

export const sfx = {
  select: () => play(() => tone({ freq: 660, duration: 0.07, gain: 0.04 })),
  hover: () => play(() => tone({ freq: 880, duration: 0.03, gain: 0.02 })),

  /** Player landed damage — rising triad. */
  hit: () => play(() => {
    tone({ freq: 520, duration: 0.09, gain: 0.06 });
    tone({ freq: 780, duration: 0.11, gain: 0.05, delay: 0.06 });
    tone({ freq: 1040, duration: 0.14, gain: 0.04, delay: 0.13 });
  }),

  /** Tests failed — descending buzz. */
  miss: () => play(() => tone({ freq: 220, sweepTo: 90, duration: 0.28, type: 'sawtooth', gain: 0.05 })),

  /** Bot connected on you. */
  incoming: () => play(() => {
    tone({ freq: 300, sweepTo: 140, duration: 0.2, type: 'sawtooth', gain: 0.05 });
    tone({ freq: 160, duration: 0.16, type: 'square', gain: 0.04, delay: 0.1 });
  }),

  /** Clock pressure. */
  tick: () => play(() => tone({ freq: 1200, duration: 0.03, gain: 0.03 })),
  warning: () => play(() => tone({ freq: 440, sweepTo: 320, duration: 0.16, gain: 0.05 })),

  victory: () => play(() => {
    [523, 659, 784, 1046].forEach((freq, i) =>
      tone({ freq, duration: 0.22, type: 'triangle', gain: 0.06, delay: i * 0.11 })
    );
  }),

  defeat: () => play(() => {
    [392, 330, 262, 196].forEach((freq, i) =>
      tone({ freq, duration: 0.3, type: 'triangle', gain: 0.06, delay: i * 0.14 })
    );
  }),

  /** Match found in the terminal. */
  alert: () => play(() => {
    tone({ freq: 880, duration: 0.09, gain: 0.05 });
    tone({ freq: 880, duration: 0.09, gain: 0.05, delay: 0.14 });
  }),
};

export default sfx;
