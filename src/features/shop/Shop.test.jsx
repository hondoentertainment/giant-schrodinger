import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Shop } from './Shop';

vi.mock('../../context/ToastContext', () => ({
    useToast: () => ({ toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn() } }),
}));

describe('Shop', () => {
    it('renders shop heading and local preview context', () => {
        render(<Shop onBack={vi.fn()} />);
        expect(screen.getByText(/Cosmetic Shop/i)).toBeInTheDocument();
    });
});
