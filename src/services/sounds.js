/**
 * Sound effects service for Venn with Friends
 *
 * Uses Web Audio API to generate sounds programmatically — no external
 * audio files required. All sounds are short (100-500ms) and purely
 * synthesised from oscillator nodes.
 */

const MUTE_KEY = 'vwf_sound_muted';

let audioCtx = null;

// Cache mute state in memory to avoid per-call localStorage reads
let _mutedCache = null;

function getCtx() {
  if (audioCtx) return audioCtx;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  } catch {
    return null;
  }
}

async function ensureResumed(ctx) {
  if (ctx && ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      // ignore
    }
  }
}

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

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);

    // Disconnect nodes after playback to free audio graph resources
    osc.onended = () => {
      gain.disconnect();
      osc.disconnect();
    };
  } catch {
    // Never let audio errors crash the app
  }
}

// ---------------------------------------------------------------------------
// Mute management
// ---------------------------------------------------------------------------

export function isMuted() {
  if (_mutedCache !== null) return _mutedCache;
  try {
    _mutedCache = localStorage.getItem(MUTE_KEY) === 'true';
  } catch {
    _mutedCache = false;
  }
  return _mutedCache;
}

export function setMuted(value) {
  _mutedCache = !!value;
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

export function initAudio() {
  try {
    const ctx = getCtx();
    if (ctx) ensureResumed(ctx);
    return ctx;
  } catch {
    return null;
  }
}

export function playSubmitSound() {
  if (isMuted()) return;
  playTone({ frequency: 880, duration: 0.15, type: 'sine', volume: 0.25 });
}

export function playScoreReveal(score) {
  if (isMuted()) return;
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
}

export function playStreakSound(streakCount) {
  if (isMuted()) return;
  const count = Math.min(streakCount, 8);
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
}

export function playConfetti() {
  if (isMuted()) return;
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
}

export function playTickSound() {
  if (isMuted()) return;
  playTone({ frequency: 1000, duration: 0.05, type: 'sine', volume: 0.1 });
}

export function playUrgentTick() {
  if (isMuted()) return;
  playTone({ frequency: 1200, duration: 0.08, type: 'square', volume: 0.2 });
}

export function playError() {
  if (isMuted()) return;
  playTone({ frequency: 400, duration: 0.15, type: 'sawtooth', volume: 0.2 });
  playTone({ frequency: 300, duration: 0.15, type: 'sawtooth', volume: 0.2, delay: 0.12 });
  playTone({ frequency: 200, duration: 0.2, type: 'sawtooth', volume: 0.2, delay: 0.24 });
}
