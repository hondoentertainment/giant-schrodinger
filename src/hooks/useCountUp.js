import { useState, useEffect, useRef } from 'react';

export function useCountUp(endValue, duration = 1000, startValue = 0) {
    const [value, setValue] = useState(startValue);
    const startTimeRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        if (endValue === undefined || endValue === null) return;

        startTimeRef.current = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTimeRef.current;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = startValue + (endValue - startValue) * easeOut;

            setValue(Math.round(currentValue * 10) / 10);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [endValue, duration, startValue]);

    return value;
}
