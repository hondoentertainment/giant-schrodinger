import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeBuilder } from './ThemeBuilder';

vi.mock('../../context/GameContext', () => ({
    useGame: () => ({ user: { name: 'Test' } }),
}));

vi.mock('../../context/ToastContext', () => ({
    useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('../../services/themeBuilder', () => ({
    createCustomTheme: vi.fn(),
    getCustomThemes: () => [],
    deleteCustomTheme: vi.fn(),
    shareThemeUrl: vi.fn(),
    getFeaturedThemes: () => [],
    calculateMultiplier: () => 1,
    exportThemeAsLink: vi.fn(),
}));

describe('ThemeBuilder', () => {
    it('renders theme builder heading', () => {
        render(<ThemeBuilder onBack={vi.fn()} />);
        expect(screen.getByText('Theme Builder')).toBeInTheDocument();
    });
});
