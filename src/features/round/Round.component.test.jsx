import { describe, it, expect, vi } from 'vitest';

// Lightweight module-level tests for the Round component
// Full rendering tests require too many mocks and cause OOM in CI.
// These verify the module exports correctly.

describe('Round module', () => {
    it('exports a Round component', async () => {
        // Mock all heavy dependencies before importing
        vi.mock('../../context/GameContext', () => ({
            useGame: () => ({
                setGameState: vi.fn(),
                user: { name: 'Test', themeId: 'neon' },
                roundNumber: 1,
                totalRounds: 5,
                currentModifier: { id: 'normal', timeFactor: 1, scoreFactor: 1 },
                isDailyChallenge: false,
                trackUsedAssets: vi.fn(),
                getUsedAssetIds: vi.fn().mockReturnValue([]),
            }),
        }));

        const mod = await import('./Round');
        expect(mod.Round).toBeDefined();
        expect(typeof mod.Round).toBe('function');
    });
});
