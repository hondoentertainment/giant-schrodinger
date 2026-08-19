import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingModal } from './OnboardingModal';

describe('OnboardingModal', () => {
    it('shows one example and a play button without scoring lecture', async () => {
        const onDismiss = vi.fn();
        render(<OnboardingModal onDismiss={onDismiss} />);

        expect(screen.getByRole('heading', { name: /How Venn Works/i })).toBeInTheDocument();
        expect(screen.getByText(/one witty phrase/i)).toBeInTheDocument();
        expect(screen.getByText(/Coffee/)).toBeInTheDocument();
        expect(screen.getByText(/Robot/)).toBeInTheDocument();
        expect(screen.getByText(/My morning fuel before I boot up/)).toBeInTheDocument();
        expect(screen.queryByText(/Who scores your solo rounds/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Play daily to build a streak/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Weak connection/i)).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: /Got it, let's play/i }));
        expect(onDismiss).toHaveBeenCalledTimes(1);
    });
});
