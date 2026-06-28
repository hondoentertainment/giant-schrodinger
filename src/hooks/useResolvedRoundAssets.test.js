import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useResolvedRoundAssets } from './useResolvedRoundAssets';

vi.mock('../services/assetSelection', () => ({
    loadSelectedAssets: vi.fn(async (assets) => assets.map((asset) => ({
        ...asset,
        url: asset.url?.replace('placeholder', 'resolved') || asset.url,
    }))),
}));

import { loadSelectedAssets } from '../services/assetSelection';

describe('useResolvedRoundAssets', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns null assets when source is missing', () => {
        const { result } = renderHook(() => useResolvedRoundAssets(null));
        expect(result.current.assets).toBeNull();
        expect(result.current.mediaLoading).toBe(false);
    });

    it('resolves assets through loadSelectedAssets', async () => {
        const source = {
            left: { id: 'a', label: 'A', url: 'https://example.com/placeholder-a.jpg' },
            right: { id: 'b', label: 'B', url: 'https://example.com/placeholder-b.jpg' },
        };

        const { result } = renderHook(() => useResolvedRoundAssets(source));

        await waitFor(() => {
            expect(result.current.mediaLoading).toBe(false);
        });

        expect(loadSelectedAssets).toHaveBeenCalled();
        expect(result.current.assets.left.url).toContain('resolved');
    });
});
