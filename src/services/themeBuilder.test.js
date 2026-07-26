import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
    calculateMultiplier,
    createCustomTheme,
    getCustomThemes,
    getThemeByCode,
    deleteCustomTheme,
    shareThemeUrl,
    parseThemeFromUrl,
    clearThemeFromUrl,
    getThemeStats,
    recordThemePlay,
    getFeaturedThemes,
    exportThemeAsLink,
    importThemeFromLink,
    getSharedThemes,
    saveSharedTheme,
} from './themeBuilder';

describe('themeBuilder service', () => {
    beforeEach(() => {
        localStorage.clear();
        window.location.hash = '';
    });

    describe('calculateMultiplier', () => {
        it('returns 1.0 at 60s timer', () => {
            expect(calculateMultiplier(60)).toBe(1.0);
        });

        it('increases for shorter timers (clamped to 1.3)', () => {
            expect(calculateMultiplier(30)).toBeCloseTo(1.3, 2);
            expect(calculateMultiplier(10)).toBe(1.3);
        });

        it('clamps to 1.0 minimum for very long timers', () => {
            expect(calculateMultiplier(120)).toBe(1.0);
        });
    });

    describe('createCustomTheme', () => {
        it('creates a theme with defaults and a 6-letter code', () => {
            const theme = createCustomTheme({ name: 'My Theme', colorPalette: 'p', timerSeconds: 60 });
            expect(theme.name).toBe('My Theme');
            expect(theme.code).toMatch(/^[A-Z]{6}$/);
            expect(theme.multiplier).toBe(1.0);
            expect(theme.timerSeconds).toBe(60);
            expect(theme.playCount).toBe(0);
        });

        it('clamps timerSeconds between 30 and 90', () => {
            const low = createCustomTheme({ name: 'Low', timerSeconds: 10 });
            const high = createCustomTheme({ name: 'High', timerSeconds: 9999 });
            expect(low.timerSeconds).toBe(30);
            expect(high.timerSeconds).toBe(90);
        });

        it('defaults name to "Untitled Theme" and creator to "Anonymous"', () => {
            const theme = createCustomTheme({});
            expect(theme.name).toBe('Untitled Theme');
            expect(theme.creatorName).toBe('Anonymous');
        });

        it('persists to storage; getCustomThemes reads it back', () => {
            const theme = createCustomTheme({ name: 'Persist' });
            const list = getCustomThemes();
            expect(list.some((t) => t.id === theme.id)).toBe(true);
        });
    });

    describe('getThemeByCode', () => {
        it('returns null for empty code', () => {
            expect(getThemeByCode('')).toBeNull();
            expect(getThemeByCode(null)).toBeNull();
        });

        it('matches the code case-insensitively', () => {
            const theme = createCustomTheme({ name: 'T' });
            const found = getThemeByCode(theme.code.toLowerCase());
            expect(found?.id).toBe(theme.id);
        });

        it('returns null when no theme matches', () => {
            expect(getThemeByCode('ZZZZZZ')).toBeNull();
        });
    });

    describe('deleteCustomTheme', () => {
        it('removes the theme and its stats', () => {
            const theme = createCustomTheme({ name: 'Del' });
            recordThemePlay(theme.id, 5);
            deleteCustomTheme(theme.id);
            expect(getCustomThemes().find((t) => t.id === theme.id)).toBeUndefined();
            expect(getThemeStats(theme.id)).toEqual({ playCount: 0, avgScore: 0, totalRounds: 0 });
        });
    });

    describe('URL helpers', () => {
        it('shareThemeUrl builds a hash URL', () => {
            const url = shareThemeUrl('ABCDEF');
            expect(url).toContain('#theme=ABCDEF');
        });

        it('parseThemeFromUrl extracts uppercase code from hash', () => {
            window.location.hash = '#theme=abcdef';
            expect(parseThemeFromUrl()).toBe('ABCDEF');
        });

        it('parseThemeFromUrl returns null when no theme param', () => {
            window.location.hash = '#something-else';
            expect(parseThemeFromUrl()).toBeNull();
        });

        it('clearThemeFromUrl calls history.replaceState when theme= is present', () => {
            const spy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
            window.location.hash = '#theme=ABCDEF';
            clearThemeFromUrl();
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });

        it('clearThemeFromUrl is a no-op when hash has no theme=', () => {
            const spy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
            window.location.hash = '#other';
            clearThemeFromUrl();
            expect(spy).not.toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe('recordThemePlay / getThemeStats', () => {
        it('returns zeros for a theme with no plays', () => {
            expect(getThemeStats('none')).toEqual({ playCount: 0, avgScore: 0, totalRounds: 0 });
        });

        it('accumulates plays and averages scores', () => {
            const theme = createCustomTheme({ name: 'Avg' });
            recordThemePlay(theme.id, 6);
            recordThemePlay(theme.id, 8);
            const stats = getThemeStats(theme.id);
            expect(stats.playCount).toBe(2);
            expect(stats.totalRounds).toBe(2);
            expect(stats.avgScore).toBe(7);
        });
    });

    describe('getFeaturedThemes', () => {
        it('returns themes sorted by playCount descending, max 10', () => {
            const themes = [];
            for (let i = 0; i < 12; i++) {
                const t = createCustomTheme({ name: `T${i}` });
                themes.push(t);
                for (let j = 0; j < i; j++) recordThemePlay(t.id, 5);
            }
            const featured = getFeaturedThemes();
            expect(featured).toHaveLength(10);
            expect(featured[0].playCount).toBeGreaterThanOrEqual(featured[1].playCount);
        });
    });

    describe('exportThemeAsLink / importThemeFromLink', () => {
        it('round-trips a theme through the base64 encoded hash', () => {
            const theme = {
                name: 'Sharable',
                colors: ['red', 'orange'],
                gradient: 'from-red to-orange',
                assets: [{ label: 'A', url: 'u1' }, { label: 'B', url: 'u2' }],
            };
            const url = exportThemeAsLink(theme);
            expect(url).toContain('#theme_');
            const hash = url.split('#')[1];
            const imported = importThemeFromLink(hash);
            expect(imported.name).toBe('Sharable');
            expect(imported.images).toHaveLength(2);
            expect(imported.images[0].label).toBe('A');
        });

        it('importThemeFromLink returns null for non-theme hashes', () => {
            expect(importThemeFromLink('not-a-theme')).toBeNull();
            expect(importThemeFromLink('theme_not_base64!!!')).toBeNull();
            expect(importThemeFromLink(undefined)).toBeNull();
        });

        it('importThemeFromLink returns null when decoded json is invalid shape', () => {
            const badHash = 'theme_' + btoa(JSON.stringify({ name: 'only name' }));
            expect(importThemeFromLink(badHash)).toBeNull();
        });
    });

    describe('getSharedThemes / saveSharedTheme', () => {
        it('starts empty', () => {
            expect(getSharedThemes()).toEqual([]);
        });

        it('saveSharedTheme persists with an id and playCount', () => {
            saveSharedTheme({ name: 'Shared', images: [] });
            const list = getSharedThemes();
            expect(list).toHaveLength(1);
            expect(list[0].name).toBe('Shared');
            expect(list[0].playCount).toBe(0);
            expect(list[0].id).toMatch(/^shared-/);
        });

        it('keeps only the most recent 20 shared themes', () => {
            for (let i = 0; i < 25; i++) {
                saveSharedTheme({ name: `S${i}`, images: [] });
            }
            expect(getSharedThemes()).toHaveLength(20);
        });
    });
});
