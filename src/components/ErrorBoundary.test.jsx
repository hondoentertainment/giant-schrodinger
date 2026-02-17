import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from './ErrorBoundary';

const ThrowError = ({ shouldThrow }) => {
    if (shouldThrow) throw new Error('Test error');
    return <div>OK</div>;
};

describe('ErrorBoundary', () => {
    let consoleSpy;

    beforeEach(() => {
        consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleSpy?.mockRestore();
    });

    it('renders children when no error', () => {
        render(
            <ErrorBoundary>
                <div data-testid="child">Child content</div>
            </ErrorBoundary>
        );
        expect(screen.getByTestId('child')).toHaveTextContent('Child content');
    });

    it('renders fallback UI when child throws', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );
        expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
        expect(screen.getByText(/Try Again/)).toBeInTheDocument();
        expect(screen.getByText(/Refresh Page/)).toBeInTheDocument();
    });

    it('Try Again button is clickable', async () => {
        const user = userEvent.setup();
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );
        const tryAgain = screen.getByRole('button', { name: /Try Again/i });
        await user.click(tryAgain);
        expect(tryAgain).toBeInTheDocument();
    });

    it('has accessible recovery buttons', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );
        const tryAgain = screen.getByRole('button', { name: /Try Again/i });
        const refresh = screen.getByRole('button', { name: /Refresh Page/i });
        expect(tryAgain).toBeInTheDocument();
        expect(refresh).toBeInTheDocument();
    });
});
