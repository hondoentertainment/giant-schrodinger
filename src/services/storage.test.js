import { describe, it, expect, beforeEach } from 'vitest';
import {
    getCollisions,
    saveCollision,
    deleteCollision,
    clearCollisions,
    getCollisionStats,
} from './storage';

describe('storage service', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('getCollisions', () => {
        it('returns empty array when no data', () => {
            expect(getCollisions()).toEqual([]);
        });

        it('returns parsed collisions from localStorage', () => {
            const collisions = [{ id: '1', score: 8 }];
            localStorage.setItem('venn_collisions', JSON.stringify(collisions));
            expect(getCollisions()).toEqual(collisions);
        });

        it('returns empty array on corrupted JSON', () => {
            localStorage.setItem('venn_collisions', 'invalid json{');
            expect(getCollisions()).toEqual([]);
        });
    });

    describe('saveCollision', () => {
        it('adds id and timestamp to collision', () => {
            const collision = { score: 9, assets: {} };
            const saved = saveCollision(collision);
            expect(saved.id).toBeDefined();
            expect(saved.timestamp).toBeDefined();
            expect(saved.score).toBe(9);
        });

        it('prepends new collision (newest first)', () => {
            saveCollision({ score: 1 });
            saveCollision({ score: 2 });
            const collisions = getCollisions();
            expect(collisions[0].score).toBe(2);
            expect(collisions[1].score).toBe(1);
        });

        it('returns collision object with id on save', () => {
            const result = saveCollision({ score: 5 });
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('timestamp');
        });
    });

    describe('deleteCollision', () => {
        it('removes collision by id', async () => {
            saveCollision({ score: 1 });
            await new Promise((r) => setTimeout(r, 2));
            const second = saveCollision({ score: 2 });
            deleteCollision(second.id);
            const collisions = getCollisions();
            expect(collisions).toHaveLength(1);
            expect(collisions[0].score).toBe(1);
        });

        it('returns true on success', () => {
            const saved = saveCollision({ score: 1 });
            expect(deleteCollision(saved.id)).toBe(true);
        });

        it('returns true when deleting non-existent id (no-op)', () => {
            expect(deleteCollision('nonexistent')).toBe(true);
        });
    });

    describe('clearCollisions', () => {
        it('removes all collisions', () => {
            saveCollision({ score: 1 });
            saveCollision({ score: 2 });
            clearCollisions();
            expect(getCollisions()).toEqual([]);
        });

        it('returns true', () => {
            expect(clearCollisions()).toBe(true);
        });
    });

    describe('getCollisionStats', () => {
        it('returns zeros when empty', () => {
            const stats = getCollisionStats();
            expect(stats.total).toBe(0);
            expect(stats.averageScore).toBe(0);
            expect(stats.highestScore).toBe(0);
            expect(stats.lowestScore).toBe(0);
            expect(stats.totalRounds).toBe(0);
            expect(stats.byTheme).toEqual({});
        });

        it('computes stats from collisions', () => {
            saveCollision({ score: 5, themeId: 'neon' });
            saveCollision({ score: 9, themeId: 'neon' });
            saveCollision({ score: 7, themeId: 'mystery' });
            const stats = getCollisionStats();
            expect(stats.total).toBe(3);
            expect(stats.averageScore).toBe(7);
            expect(stats.highestScore).toBe(9);
            expect(stats.lowestScore).toBe(5);
            expect(stats.byTheme.neon).toBe(2);
            expect(stats.byTheme.mystery).toBe(1);
        });

        it('handles collisions without score', () => {
            saveCollision({ themeId: 'default' });
            const stats = getCollisionStats();
            expect(stats.averageScore).toBe(0);
        });
    });
});
