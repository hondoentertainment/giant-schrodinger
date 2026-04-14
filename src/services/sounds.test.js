import { describe, it, expect, beforeEach, vi } from 'vitest';

// Build a fresh mock AudioContext that exposes call trackers on its prototype.
const createOscillator = vi.fn();
const createGain = vi.fn();

class MockAudioContext {
    constructor() {
        this.state = 'running';
        this.currentTime = 0;
        this.destination = {};
        this.resume = vi.fn().mockResolvedValue();
    }
    createOscillator() {
        const osc = {
            type: 'sine',
            frequency: { value: 0, setValueAtTime: vi.fn() },
            connect: vi.fn(),
            disconnect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn(),
            onended: null,
        };
        createOscillator(osc);
        return osc;
    }
    createGain() {
        const gain = {
            gain: {
                value: 0,
                setValueAtTime: vi.fn(),
                linearRampToValueAtTime: vi.fn(),
                exponentialRampToValueAtTime: vi.fn(),
            },
            connect: vi.fn(),
            disconnect: vi.fn(),
        };
        createGain(gain);
        return gain;
    }
}

vi.stubGlobal('AudioContext', MockAudioContext);

// Import after stubbing so the service picks up the mock when first used.
let sounds;
beforeEach(async () => {
    localStorage.clear();
    createOscillator.mockClear();
    createGain.mockClear();
    // Re-import with fresh module-level state (audioCtx cache, mute cache).
    vi.resetModules();
    sounds = await import('./sounds');
});

describe('sounds service', () => {
    describe('mute management', () => {
        it('isMuted defaults to false', () => {
            expect(sounds.isMuted()).toBe(false);
        });

        it('setMuted persists to localStorage and updates cache', () => {
            sounds.setMuted(true);
            expect(sounds.isMuted()).toBe(true);
            expect(localStorage.getItem('vwf_sound_muted')).toBe('true');
        });

        it('toggleMute flips the current state', () => {
            expect(sounds.toggleMute()).toBe(true);
            expect(sounds.toggleMute()).toBe(false);
        });

        it('isMuted reads stored true on first call after import', async () => {
            localStorage.setItem('vwf_sound_muted', 'true');
            vi.resetModules();
            const fresh = await import('./sounds');
            expect(fresh.isMuted()).toBe(true);
        });
    });

    describe('initAudio', () => {
        it('returns a context', () => {
            const ctx = sounds.initAudio();
            expect(ctx).toBeInstanceOf(MockAudioContext);
        });
    });

    describe('playSubmitSound', () => {
        it('creates an oscillator when not muted', () => {
            sounds.playSubmitSound();
            expect(createOscillator).toHaveBeenCalledTimes(1);
            expect(createGain).toHaveBeenCalledTimes(1);
        });

        it('is a no-op when muted', () => {
            sounds.setMuted(true);
            sounds.playSubmitSound();
            expect(createOscillator).not.toHaveBeenCalled();
        });
    });

    describe('playScoreReveal', () => {
        it('plays 3 tones for high scores (>=9)', () => {
            sounds.playScoreReveal(10);
            expect(createOscillator).toHaveBeenCalledTimes(3);
        });

        it('plays 2 tones for mid scores (5-8)', () => {
            sounds.playScoreReveal(6);
            expect(createOscillator).toHaveBeenCalledTimes(2);
        });

        it('plays 2 tones for low scores (<5)', () => {
            sounds.playScoreReveal(2);
            expect(createOscillator).toHaveBeenCalledTimes(2);
        });

        it('is a no-op when muted', () => {
            sounds.setMuted(true);
            sounds.playScoreReveal(10);
            expect(createOscillator).not.toHaveBeenCalled();
        });
    });

    describe('playStreakSound', () => {
        it('plays one tone per streak up to a cap of 8', () => {
            sounds.playStreakSound(3);
            expect(createOscillator).toHaveBeenCalledTimes(3);
        });

        it('caps at 8 for very high streaks', () => {
            sounds.playStreakSound(50);
            expect(createOscillator).toHaveBeenCalledTimes(8);
        });
    });

    describe('playConfetti', () => {
        it('plays 6 tones', () => {
            sounds.playConfetti();
            expect(createOscillator).toHaveBeenCalledTimes(6);
        });
    });

    describe('playClick / playTickSound / playUrgentTick / playError', () => {
        it('playClick creates an oscillator', () => {
            sounds.playClick();
            expect(createOscillator).toHaveBeenCalledTimes(1);
        });

        it('playTickSound creates one tone', () => {
            sounds.playTickSound();
            expect(createOscillator).toHaveBeenCalledTimes(1);
        });

        it('playUrgentTick creates one tone', () => {
            sounds.playUrgentTick();
            expect(createOscillator).toHaveBeenCalledTimes(1);
        });

        it('playError creates 3 descending tones', () => {
            sounds.playError();
            expect(createOscillator).toHaveBeenCalledTimes(3);
        });

        it('all helpers are no-ops when muted', () => {
            sounds.setMuted(true);
            sounds.playClick();
            sounds.playTickSound();
            sounds.playUrgentTick();
            sounds.playError();
            expect(createOscillator).not.toHaveBeenCalled();
        });
    });
});
