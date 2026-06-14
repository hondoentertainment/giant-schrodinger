import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    addToOfflineQueue,
    getOfflineQueue,
    clearOfflineQueue,
    removeFromOfflineQueue,
    getQueueCount,
    processOfflineQueue,
} from './offlineQueue';

describe('offlineQueue', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('addToOfflineQueue appends entry with queuedAt timestamp', () => {
        const before = Date.now();
        addToOfflineQueue({
            submission: 'my answer',
            assets: { left: { label: 'A' }, right: { label: 'B' } },
            mediaType: 'text',
        });
        const after = Date.now();

        const queue = getOfflineQueue();
        expect(queue).toHaveLength(1);
        expect(queue[0].submission).toBe('my answer');
        expect(queue[0].assets).toEqual({ left: { label: 'A' }, right: { label: 'B' } });
        expect(queue[0].mediaType).toBe('text');
        expect(typeof queue[0].queuedAt).toBe('string');

        const ts = new Date(queue[0].queuedAt).getTime();
        expect(ts).toBeGreaterThanOrEqual(before);
        expect(ts).toBeLessThanOrEqual(after);
    });

    it('multiple adds accumulate in insertion order', () => {
        addToOfflineQueue({ submission: 'first', assets: {}, mediaType: 'text' });
        addToOfflineQueue({ submission: 'second', assets: {}, mediaType: 'text' });
        addToOfflineQueue({ submission: 'third', assets: {}, mediaType: 'image' });

        const queue = getOfflineQueue();
        expect(queue).toHaveLength(3);
        expect(queue.map((e) => e.submission)).toEqual(['first', 'second', 'third']);
    });

    it('getOfflineQueue returns [] when empty', () => {
        expect(getOfflineQueue()).toEqual([]);
    });

    it('getOfflineQueue returns exactly what was added', () => {
        const entry = {
            submission: 'exact',
            assets: { left: { label: 'X' }, right: { label: 'Y' } },
            mediaType: 'text',
        };
        addToOfflineQueue(entry);
        const queue = getOfflineQueue();
        expect(queue[0]).toMatchObject(entry);
    });

    it('getQueueCount returns correct count', () => {
        expect(getQueueCount()).toBe(0);
        addToOfflineQueue({ submission: 'a', assets: {}, mediaType: 'text' });
        expect(getQueueCount()).toBe(1);
        addToOfflineQueue({ submission: 'b', assets: {}, mediaType: 'text' });
        addToOfflineQueue({ submission: 'c', assets: {}, mediaType: 'text' });
        expect(getQueueCount()).toBe(3);
    });

    it('clearOfflineQueue empties the queue', () => {
        addToOfflineQueue({ submission: 'a', assets: {}, mediaType: 'text' });
        addToOfflineQueue({ submission: 'b', assets: {}, mediaType: 'text' });
        expect(getQueueCount()).toBe(2);
        clearOfflineQueue();
        expect(getOfflineQueue()).toEqual([]);
        expect(getQueueCount()).toBe(0);
    });

    it('removeFromOfflineQueue(idx) removes only that entry; others preserved', () => {
        addToOfflineQueue({ submission: 'a', assets: {}, mediaType: 'text' });
        addToOfflineQueue({ submission: 'b', assets: {}, mediaType: 'text' });
        addToOfflineQueue({ submission: 'c', assets: {}, mediaType: 'text' });

        removeFromOfflineQueue(1);

        const queue = getOfflineQueue();
        expect(queue).toHaveLength(2);
        expect(queue.map((e) => e.submission)).toEqual(['a', 'c']);
    });

    it('removeFromOfflineQueue(idx) with out-of-range index is a no-op', () => {
        addToOfflineQueue({ submission: 'a', assets: {}, mediaType: 'text' });
        addToOfflineQueue({ submission: 'b', assets: {}, mediaType: 'text' });

        removeFromOfflineQueue(-1);
        expect(getQueueCount()).toBe(2);

        removeFromOfflineQueue(5);
        expect(getQueueCount()).toBe(2);

        removeFromOfflineQueue(2);
        expect(getQueueCount()).toBe(2);

        const queue = getOfflineQueue();
        expect(queue.map((e) => e.submission)).toEqual(['a', 'b']);
    });

    it('processOfflineQueue calls scoreFn for each entry and clears queue on full success', async () => {
        addToOfflineQueue({ submission: 'one', assets: { left: 'L1', right: 'R1' }, mediaType: 'text' });
        addToOfflineQueue({ submission: 'two', assets: { left: 'L2', right: 'R2' }, mediaType: 'text' });

        const scoreFn = vi.fn().mockResolvedValue({ score: 7 });
        await processOfflineQueue(scoreFn);

        expect(scoreFn).toHaveBeenCalledTimes(2);
        expect(getOfflineQueue()).toEqual([]);
    });

    it('processOfflineQueue keeps failed entries in queue and removes successes', async () => {
        addToOfflineQueue({ submission: 'good1', assets: {}, mediaType: 'text' });
        addToOfflineQueue({ submission: 'bad', assets: {}, mediaType: 'text' });
        addToOfflineQueue({ submission: 'good2', assets: {}, mediaType: 'text' });

        const scoreFn = vi.fn(async (submission) => {
            if (submission === 'bad') throw new Error('network failure');
            return { score: 5 };
        });

        await processOfflineQueue(scoreFn);

        expect(scoreFn).toHaveBeenCalledTimes(3);
        const remaining = getOfflineQueue();
        expect(remaining).toHaveLength(1);
        expect(remaining[0].submission).toBe('bad');
    });

    it('processOfflineQueue passes (submission, assets.left, assets.right, mediaType) in order', async () => {
        addToOfflineQueue({
            submission: 'my answer',
            assets: { left: { label: 'Left' }, right: { label: 'Right' } },
            mediaType: 'hard',
        });

        const scoreFn = vi.fn().mockResolvedValue({ score: 1 });
        await processOfflineQueue(scoreFn);

        expect(scoreFn).toHaveBeenCalledTimes(1);
        expect(scoreFn).toHaveBeenCalledWith(
            'my answer',
            { label: 'Left' },
            { label: 'Right' },
            'hard',
        );
    });

    it('processOfflineQueue handles missing assets gracefully (passes undefined for left/right)', async () => {
        // Entry without assets object
        addToOfflineQueue({ submission: 'lone', mediaType: 'text' });

        const scoreFn = vi.fn().mockResolvedValue({ score: 0 });
        await processOfflineQueue(scoreFn);

        expect(scoreFn).toHaveBeenCalledTimes(1);
        expect(scoreFn).toHaveBeenCalledWith('lone', undefined, undefined, 'text');
    });

    it('processOfflineQueue on empty queue is a no-op and does not call scoreFn', async () => {
        const scoreFn = vi.fn();
        await processOfflineQueue(scoreFn);
        expect(scoreFn).not.toHaveBeenCalled();
        expect(getOfflineQueue()).toEqual([]);
    });
});
