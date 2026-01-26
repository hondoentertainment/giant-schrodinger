import { useCallback, useRef } from 'react';

// Simple sound hook using Web Audio API for browser-native sounds
export function useSound() {
    const audioContextRef = useRef(null);

    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioContextRef.current;
    }, []);

    const playTone = useCallback((frequency, duration, type = 'sine') => {
        try {
            const ctx = getAudioContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

            // Fade out
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + duration);
        } catch (e) {
            console.log('Audio not supported');
        }
    }, [getAudioContext]);

    const playTick = useCallback(() => {
        playTone(800, 0.05, 'square');
    }, [playTone]);

    const playSubmit = useCallback(() => {
        // Rising chord
        playTone(523, 0.15, 'sine'); // C5
        setTimeout(() => playTone(659, 0.15, 'sine'), 50); // E5
        setTimeout(() => playTone(784, 0.2, 'sine'), 100); // G5
    }, [playTone]);

    const playReveal = useCallback(() => {
        // Fanfare-like sequence
        playTone(523, 0.2, 'sine');
        setTimeout(() => playTone(659, 0.2, 'sine'), 100);
        setTimeout(() => playTone(784, 0.2, 'sine'), 200);
        setTimeout(() => playTone(1047, 0.4, 'sine'), 300);
    }, [playTone]);

    const playSuccess = useCallback(() => {
        playTone(880, 0.1, 'sine');
        setTimeout(() => playTone(1047, 0.15, 'sine'), 100);
    }, [playTone]);

    return { playTick, playSubmit, playReveal, playSuccess };
}
