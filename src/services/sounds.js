/**
 * Sound effects service for Venn with Friends
 *
 * Uses Web Audio API to generate sounds programmatically — no external
 * audio files required. All sounds are short (100-500ms) and purely
 * synthesised from oscillator nodes.
 *
 * Usage:
 *   import { initAudio, playSubmitSound, toggleMute } from './sounds';
 *
 *   // Call once on first user interaction (click / tap)
 *   const ctx = initAudio();
 *
 *   playSubmitSound();
 */

const MUTE_KEY = 'vwf_sound_muted';

let audioCtx = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Lazily retrieve (or create) the shared AudioContext.
 * Returns null when audio is unavailable.
 */
function getCtx() {
  if (audioCtx) return audioCtx;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Resume the AudioContext if it is in a suspended state (common on mobile
 * where autoplay policies apply).
 */
async function ensureResumed(ctx) {
  if (ctx && ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      // ignore
    }
  }
}

/**
 * Play a single tone.
 *
 * @param {object}  opts
 * @param {number}  opts.frequency  - Hz
 * @param {number}  opts.duration   - seconds
 * @param {string}  [opts.type]     - oscillator type (sine, square, triangle, sawtooth)
 * @param {number}  [opts.volume]   - gain 0-1
 * @param {number}  [opts.delay]    - start delay in seconds
 */
function playTone({
  frequency,
  duration,
  type = 'sine',
  volume = 0.3,
  delay = 0,
} = {}) {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    ensureResumed(ctx);

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);

    // Quick attack / decay envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  } catch {
    // Never let audio errors crash the app
  }
}

// ---------------------------------------------------------------------------
// Mute management
// ---------------------------------------------------------------------------

export function isMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setMuted(value) {
  try {
    localStorage.setItem(MUTE_KEY, value ? 'true' : 'false');
  } catch {
    // ignore
  }
}

export function toggleMute() {
  const next = !isMuted();
  setMuted(next);
  return next;
}

// ---------------------------------------------------------------------------
// Public sound functions
// ---------------------------------------------------------------------------

/**
 * Initialise the AudioContext. Call on the first user interaction so the
 * browser permits audio playback.
 *
 * @returns {AudioContext|null}
 */
export function initAudio() {
  try {
    const ctx = getCtx();
    if (ctx) ensureResumed(ctx);
    return ctx;
  } catch {
    return null;
  }
}

/**
 * Short pleasant "ding" on answer submission.
 */
export function playSubmitSound() {
  if (isMuted()) return;
  try {
    playTone({ frequency: 880, duration: 0.15, type: 'sine', volume: 0.25 });
  } catch {
    // ignore
  }
}

/**
 * Dramatic score reveal sound.
 * - High scores  (9-10): higher pitch, longer
 * - Medium scores (5-8): neutral tone
 * - Low scores    (1-4): low tone
 */
export function playScoreReveal(score) {
  if (isMuted()) return;
  try {
    if (score >= 9) {
      playTone({ frequency: 660, duration: 0.15, type: 'sine', volume: 0.3 });
      playTone({ frequency: 880, duration: 0.15, type: 'sine', volume: 0.3, delay: 0.12 });
      playTone({ frequency: 1100, duration: 0.3, type: 'sine', volume: 0.35, delay: 0.24 });
    } else if (score >= 5) {
      playTone({ frequency: 520, duration: 0.2, type: 'sine', volume: 0.25 });
      playTone({ frequency: 660, duration: 0.2, type: 'sine', volume: 0.25, delay: 0.15 });
    } else {
      playTone({ frequency: 260, duration: 0.3, type: 'triangle', volume: 0.2 });
      playTone({ frequency: 220, duration: 0.3, type: 'triangle', volume: 0.2, delay: 0.2 });
    }
  } catch {
    // ignore
  }
}

/**
 * Ascending tones proportional to streak length.
 */
export function playStreakSound(streakCount) {
  if (isMuted()) return;
  try {
    const count = Math.min(streakCount, 8); // cap to avoid too many tones
    const baseFreq = 440;
    for (let i = 0; i < count; i++) {
      playTone({
        frequency: baseFreq + i * 80,
        duration: 0.1,
        type: 'sine',
        volume: 0.2,
        delay: i * 0.08,
      });
    }
  } catch {
    // ignore
  }
}

/**
 * Burst of quick random high-pitched notes (for 9+ scores / confetti).
 */
export function playConfetti() {
  if (isMuted()) return;
  try {
    for (let i = 0; i < 6; i++) {
      const freq = 1200 + Math.random() * 800;
      playTone({
        frequency: freq,
        duration: 0.08,
        type: 'sine',
        volume: 0.15,
        delay: i * 0.06,
      });
    }
  } catch {
    // ignore
  }
}

/**
 * Soft click for timer countdown.
 */
export function playTickSound() {
  if (isMuted()) return;
  try {
    playTone({ frequency: 1000, duration: 0.05, type: 'sine', volume: 0.1 });
  } catch {
    // ignore
  }
}

/**
 * Louder, faster tick for the last 10 seconds.
 */
export function playUrgentTick() {
  if (isMuted()) return;
  try {
    playTone({ frequency: 1200, duration: 0.08, type: 'square', volume: 0.2 });
  } catch {
    // ignore
  }
}

/**
 * Descending buzz for errors / bust.
 */
export function playError() {
  if (isMuted()) return;
  try {
    playTone({ frequency: 400, duration: 0.15, type: 'sawtooth', volume: 0.2 });
    playTone({ frequency: 300, duration: 0.15, type: 'sawtooth', volume: 0.2, delay: 0.12 });
    playTone({ frequency: 200, duration: 0.2, type: 'sawtooth', volume: 0.2, delay: 0.24 });
  } catch {
    // ignore
  }
}
