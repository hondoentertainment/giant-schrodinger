import { useEffect, useRef } from 'react';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Traps focus within a container (e.g. modal).
 * @param {boolean} isActive - Whether the trap is active
 * @param {React.RefObject} containerRef - Ref to the trap container
 */
export function useFocusTrap(isActive, containerRef) {
    const previousFocus = useRef(null);

    useEffect(() => {
        if (!isActive || !containerRef?.current) return;

        const el = containerRef.current;
        previousFocus.current = document.activeElement;

        const focusables = el.querySelectorAll(FOCUSABLE);
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (first) first.focus();

        const handleKeyDown = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last?.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first?.focus();
                }
            }
        };

        el.addEventListener('keydown', handleKeyDown);
        return () => {
            el.removeEventListener('keydown', handleKeyDown);
            previousFocus.current?.focus?.();
        };
    }, [isActive, containerRef]);
}
