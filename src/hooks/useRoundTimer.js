import { useState, useEffect, useRef, useCallback } from 'react';

export function useRoundTimer({ timeLimit, onTimeUp, enabled = true }) {
  const [displayTime, setDisplayTime] = useState(timeLimit);
  const [roundPhase, setRoundPhase] = useState('ready'); // 'ready' | 'playing' | 'done'
  const [countdown, setCountdown] = useState(3);
  const endTimeRef = useRef(null);
  const rafRef = useRef(null);

  // Ready countdown (3-2-1-Go)
  useEffect(() => {
    if (!enabled || roundPhase !== 'ready') return;
    if (countdown <= 0) {
      setRoundPhase('playing');
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [roundPhase, countdown, enabled]);

  // RAF-based timer
  useEffect(() => {
    if (roundPhase !== 'playing') return;
    endTimeRef.current = performance.now() + timeLimit * 1000;

    function tick() {
      const remaining = Math.ceil((endTimeRef.current - performance.now()) / 1000);
      setDisplayTime(Math.max(0, remaining));
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [timeLimit, roundPhase]);

  // Time-up detection
  useEffect(() => {
    if (roundPhase !== 'playing') return;
    if (displayTime <= 0) {
      setRoundPhase('done');
      onTimeUp?.();
    }
  }, [displayTime, roundPhase, onTimeUp]);

  const reset = useCallback(() => {
    setDisplayTime(timeLimit);
    setRoundPhase('ready');
    setCountdown(3);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, [timeLimit]);

  return {
    displayTime,
    roundPhase,
    countdown,
    isReady: roundPhase === 'ready',
    isPlaying: roundPhase === 'playing',
    isDone: roundPhase === 'done',
    reset,
  };
}
