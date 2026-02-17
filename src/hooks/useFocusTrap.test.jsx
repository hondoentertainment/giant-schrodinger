import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React, { useRef } from 'react';
import { useFocusTrap } from './useFocusTrap';

function TestComponent({ active }) {
    const ref = useRef(null);
    useFocusTrap(active, ref);
    return (
        <div ref={ref}>
            <button>First</button>
            <input type="text" placeholder="Input" />
            <button>Second</button>
        </div>
    );
}

describe('useFocusTrap', () => {
    it('focuses first focusable when active', () => {
        render(<TestComponent active={true} />);
        const firstButton = screen.getByText('First');
        expect(document.activeElement).toBe(firstButton);
    });

    it('does not focus when inactive', () => {
        render(<TestComponent active={false} />);
        const firstButton = screen.getByText('First');
        expect(document.activeElement).not.toBe(firstButton);
    });
});
