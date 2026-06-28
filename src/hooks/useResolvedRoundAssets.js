import { useState, useEffect } from 'react';
import { loadSelectedAssets } from '../services/assetSelection';

/**
 * Resolve API-backed media and warm the browser cache for a round asset pair.
 */
export function useResolvedRoundAssets(sourceAssets) {
    const [assets, setAssets] = useState(sourceAssets || null);
    const [mediaLoading, setMediaLoading] = useState(false);

    useEffect(() => {
        if (!sourceAssets?.left || !sourceAssets?.right) {
            setAssets(null);
            setMediaLoading(false);
            return undefined;
        }

        let cancelled = false;
        setAssets(sourceAssets);
        setMediaLoading(true);

        loadSelectedAssets([sourceAssets.left, sourceAssets.right])
            .then(([left, right]) => {
                if (!cancelled) {
                    setAssets({ left, right });
                    setMediaLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setAssets(sourceAssets);
                    setMediaLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [
        sourceAssets?.left?.id,
        sourceAssets?.left?.url,
        sourceAssets?.right?.id,
        sourceAssets?.right?.url,
    ]);

    return { assets, mediaLoading };
}
