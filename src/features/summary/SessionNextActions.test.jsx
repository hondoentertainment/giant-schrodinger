import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getSessionPlayCta, SessionNextActions } from './SessionNextActions';

describe('getSessionPlayCta', () => {
    it('leads with today\'s pair when the daily is still open', () => {
        expect(getSessionPlayCta({ isDailyChallenge: false, dailyPlayed: false })).toEqual({
            label: "Play today's pair",
            hint: null,
            startDaily: true,
        });
    });

    it('offers play again plus tomorrow copy after a daily finish', () => {
        expect(getSessionPlayCta({ isDailyChallenge: true, dailyPlayed: true })).toEqual({
            label: 'Play again',
            hint: "Come back for tomorrow's pair",
            startDaily: false,
        });
    });
});

describe('SessionNextActions', () => {
    it('stacks play, share, and optional invite', async () => {
        const user = userEvent.setup();
        const onPlay = vi.fn();
        const onShare = vi.fn();
        const onInvite = vi.fn();
        render(
            <SessionNextActions
                playLabel="Play again"
                playHint="Come back for tomorrow's pair"
                onPlay={onPlay}
                onShare={onShare}
                onInvite={onInvite}
            />
        );

        expect(screen.getByTestId('session-next-stack')).toBeInTheDocument();
        expect(screen.getByText(/Come back for tomorrow's pair/i)).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /Play again/i }));
        await user.click(screen.getByRole('button', { name: /Share best line/i }));
        await user.click(screen.getByRole('button', { name: /Invite friends to a room/i }));
        expect(onPlay).toHaveBeenCalledTimes(1);
        expect(onShare).toHaveBeenCalledTimes(1);
        expect(onInvite).toHaveBeenCalledTimes(1);
    });

    it('keeps a single CTA on first-session celebrate', () => {
        render(
            <SessionNextActions
                playLabel="Play again"
                onPlay={vi.fn()}
                onShare={vi.fn()}
                onInvite={vi.fn()}
                singleCta
                showShare
            />
        );
        expect(screen.getByRole('button', { name: /Share best line/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Play again/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Invite friends/i })).not.toBeInTheDocument();
    });
});
