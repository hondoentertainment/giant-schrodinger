import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const sound = vi.hoisted(() => ({
    isMuted: vi.fn(() => false),
    toggleMute: vi.fn(() => true),
    playClick: vi.fn(),
}));

vi.mock('../services/sounds', () => sound);
vi.mock('../lib/haptics', () => ({ haptic: vi.fn() }));

import { MuteToggle } from './MuteToggle';

describe('MuteToggle', () => {
    beforeEach(() => {
        sound.isMuted.mockReturnValue(false);
        sound.toggleMute.mockReturnValue(true);
    });

    it('exposes the same a11y name the lobby already uses', async () => {
        const user = userEvent.setup();
        render(<MuteToggle compact />);
        expect(screen.getByRole('button', { name: /Sound on/i })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /Sound on/i }));
        expect(sound.toggleMute).toHaveBeenCalled();
        expect(screen.getByRole('button', { name: /Sound muted/i })).toBeInTheDocument();
    });
});
