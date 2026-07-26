import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const pushMocks = vi.hoisted(() => ({
    requestNotificationPermission: vi.fn(),
    subscribeToPush: vi.fn(),
    isPushSupported: vi.fn(() => true),
}));

vi.mock('../services/pushNotifications', () => pushMocks);

vi.mock('../services/stats', () => ({
    getStats: () => ({ totalRounds: 5 }),
}));

import { NotificationBanner } from './NotificationBanner';

describe('NotificationBanner', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        pushMocks.isPushSupported.mockReturnValue(true);
        pushMocks.requestNotificationPermission.mockResolvedValue('granted');
        pushMocks.subscribeToPush.mockResolvedValue(undefined);
    });

    it('shows enable/dismiss controls when push is supported and player has enough rounds', async () => {
        render(<NotificationBanner />);
        expect(await screen.findByText(/never miss a daily challenge/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Enable/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Not now/i })).toBeInTheDocument();
    });

    it('hides after dismiss and persists the preference', async () => {
        const user = userEvent.setup();
        render(<NotificationBanner />);
        await user.click(await screen.findByRole('button', { name: /Not now/i }));
        expect(screen.queryByText(/never miss a daily challenge/i)).not.toBeInTheDocument();
        expect(localStorage.getItem('venn_notification_banner_dismissed')).toBe('true');
    });

    it('opts in to push notifications when Enable is pressed', async () => {
        const user = userEvent.setup();
        render(<NotificationBanner />);
        await user.click(await screen.findByRole('button', { name: /Enable/i }));
        await waitFor(() => {
            expect(pushMocks.requestNotificationPermission).toHaveBeenCalled();
            expect(pushMocks.subscribeToPush).toHaveBeenCalled();
            expect(localStorage.getItem('venn_push_enabled')).toBe('true');
        });
        expect(screen.queryByText(/never miss a daily challenge/i)).not.toBeInTheDocument();
    });

    it('stays hidden when already dismissed', () => {
        localStorage.setItem('venn_notification_banner_dismissed', 'true');
        render(<NotificationBanner />);
        expect(screen.queryByText(/never miss a daily challenge/i)).not.toBeInTheDocument();
    });
});
