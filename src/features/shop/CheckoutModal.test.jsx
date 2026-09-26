import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CheckoutModal } from './CheckoutModal';

describe('CheckoutModal', () => {
    it('keeps checkout disabled when Stripe is not configured', () => {
        render(<CheckoutModal onClose={() => {}} />);
        expect(screen.getByRole('status')).toHaveTextContent(/Purchases unavailable/i);
        const buttons = screen.getAllByRole('button', { name: 'Unavailable' });
        expect(buttons.length).toBeGreaterThan(0);
        buttons.forEach((button) => expect(button).toBeDisabled());
        expect(screen.queryByText(/mock session/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/purchase complete/i)).not.toBeInTheDocument();
    });
});
