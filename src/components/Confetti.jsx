import React, { useState, useEffect, useMemo } from 'react';

const COLORS = [
    '#ff6b6b', // red
    '#ffd93d', // yellow
    '#6bcb77', // green
    '#4d96ff', // blue
    '#ff6eb4', // pink
    '#a66cff', // purple
    '#ff9f43', // orange
    '#00d2d3', // teal
];

const KEYFRAMES_ID = 'confetti-keyframes';

const keyframesCSS = `
@keyframes confetti-fall {
    0% {
        transform: translateY(-10px) rotate(var(--confetti-rotate-start));
        opacity: 1;
    }
    80% {
        opacity: 1;
    }
    100% {
        transform: translateY(100vh) rotate(var(--confetti-rotate-end));
        opacity: 0;
    }
}
`;

function injectKeyframes() {
    if (typeof document === 'undefined') return;
    if (document.getElementById(KEYFRAMES_ID)) return;

    const style = document.createElement('style');
    style.id = KEYFRAMES_ID;
    style.textContent = keyframesCSS;
    document.head.appendChild(style);
}

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

export default function Confetti({ active, duration = 3000, particleCount = 50 }) {
    const [visible, setVisible] = useState(false);

    const particles = useMemo(() => {
        if (!active) return [];

        return Array.from({ length: particleCount }, (_, i) => ({
            id: i,
            x: randomBetween(0, 100),
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            size: randomBetween(8, 14),
            rotateStart: Math.floor(randomBetween(0, 360)),
            rotateEnd: Math.floor(randomBetween(360, 720)),
            delay: randomBetween(0, 0.6),
            fallDuration: randomBetween(1.5, 3.5),
        }));
    }, [active, particleCount]);

    useEffect(() => {
        if (!active) {
            setVisible(false);
            return;
        }

        injectKeyframes();
        setVisible(true);

        const timer = setTimeout(() => {
            setVisible(false);
        }, duration);

        return () => clearTimeout(timer);
    }, [active, duration]);

    if (!visible || particles.length === 0) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                pointerEvents: 'none',
                overflow: 'hidden',
            }}
            aria-hidden="true"
        >
            {particles.map((p) => (
                <div
                    key={p.id}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: `${p.x}%`,
                        width: `${p.size}px`,
                        height: `${p.size * 0.6}px`,
                        backgroundColor: p.color,
                        borderRadius: '2px',
                        '--confetti-rotate-start': `${p.rotateStart}deg`,
                        '--confetti-rotate-end': `${p.rotateEnd}deg`,
                        animation: `confetti-fall ${p.fallDuration}s ease-in ${p.delay}s forwards`,
                    }}
                />
            ))}
        </div>
    );
}
