import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AccountPanel } from './AccountPanel';

describe('AccountPanel', () => {
    it('lets a guest continue without an account when Supabase is not configured', () => {
        render(<AccountPanel variant="gate" />);
        expect(screen.getByText(/Continue without an account/i)).toBeInTheDocument();
        expect(screen.getByText(/Accounts need Supabase/i)).toBeInTheDocument();
        expect(screen.getByText(/never required for the first game/i)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Email me a link/i })).not.toBeInTheDocument();
    });
});
