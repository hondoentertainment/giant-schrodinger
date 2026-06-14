import { describe, it, expect, beforeEach } from 'vitest';
import {
    getTodayKey,
    getWeekKey,
    submitScore,
    getDailyLeaderboard,
    getWeeklyLeaderboard,
    getPlayerRank,
    getPlayerBest,
    clearOldEntries,
    getCurrentSeason,
    getSeasonalLeaderboard,
    submitSeasonalScore,
    getSeasonArchive,
} from './leaderboard';

describe('leaderboard service', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('getTodayKey / getWeekKey', () => {
        it('returns todayKey in YYYY-MM-DD format', () => {
            expect(getTodayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        it('returns weekKey in YYYY-WNN format', () => {
            expect(getWeekKey()).toMatch(/^\d{4}-W\d{2}$/);
        });

        describe('getWeekKey ISO 8601 compliance', () => {
            it('Jan 4 is always in week 1', () => {
                // 2026: Jan 4 is a Sunday of the week Mon Dec 29 2025 - Sun Jan 4 2026.
                // Per ISO, Jan 4 is always in W01 (of its own calendar year's ISO year).
                expect(getWeekKey(new Date(2026, 0, 4))).toBe('2026-W01');
                expect(getWeekKey(new Date(2024, 0, 4))).toBe('2024-W01');
                expect(getWeekKey(new Date(2020, 0, 4))).toBe('2020-W01');
            });

            it('Dec 31 can belong to week 1 of the next ISO year', () => {
                // 2024-12-31 is a Tuesday; its ISO week is 2025-W01.
                expect(getWeekKey(new Date(2024, 11, 31))).toBe('2025-W01');
            });

            it('Dec 31 stays in the current year when it is not in next year\'s W01', () => {
                // 2023-12-31 is a Sunday, in the ISO week 2023-W52.
                expect(getWeekKey(new Date(2023, 11, 31))).toBe('2023-W52');
            });

            it('Monday vs Sunday boundary lands in the same ISO week', () => {
                // 2026-04-13 (Mon) and 2026-04-19 (Sun) are the same ISO week.
                const mon = getWeekKey(new Date(2026, 3, 13));
                const sun = getWeekKey(new Date(2026, 3, 19));
                expect(mon).toBe(sun);
                // The following Monday (next week) differs.
                const nextMon = getWeekKey(new Date(2026, 3, 20));
                expect(nextMon).not.toBe(mon);
            });

            it('returns 2026-W16 for April 14, 2026', () => {
                // ISO W1 of 2026 starts Mon Dec 29 2025; Apr 13 2026 (Mon) starts W16.
                expect(getWeekKey(new Date(2026, 3, 14))).toBe('2026-W16');
            });
        });
    });

    describe('submitScore / getDailyLeaderboard', () => {
        it('persists score and returns entry object with expected fields', () => {
            const entry = submitScore('Alice', 100, 'avatar1', 5, { scoredServerSide: true });
            expect(entry).toMatchObject({
                playerName: 'Alice',
                score: 100,
                avatar: 'avatar1',
                roundCount: 5,
                trusted: true,
            });
            expect(entry.dateKey).toBe(getTodayKey());
            expect(entry.weekKey).toBe(getWeekKey());
        });

        it('returns daily entries sorted by score desc, trusted first', () => {
            submitScore('Alice', 80, 'a', 3);                             // untrusted 80
            submitScore('Bob', 60, 'b', 3, { scoredServerSide: true });   // trusted 60
            submitScore('Cara', 90, 'c', 3);                              // untrusted 90
            const daily = getDailyLeaderboard();
            expect(daily[0].playerName).toBe('Bob');       // trusted first
            expect(daily[1].playerName).toBe('Cara');      // higher untrusted
            expect(daily[2].playerName).toBe('Alice');
        });

        it('prunes entries older than 30 days on submit', () => {
            const old = {
                playerName: 'Old',
                score: 100,
                avatar: 'x',
                roundCount: 1,
                trusted: false,
                timestamp: Date.now() - 40 * 24 * 60 * 60 * 1000,
                dateKey: '2020-01-01',
                weekKey: '2020-W01',
            };
            localStorage.setItem('vwf_leaderboard', JSON.stringify([old]));
            submitScore('Fresh', 50, 'a', 1);
            const entries = JSON.parse(localStorage.getItem('vwf_leaderboard'));
            expect(entries.map((e) => e.playerName)).toEqual(['Fresh']);
        });
    });

    describe('getWeeklyLeaderboard', () => {
        it('returns entries matching current weekKey', () => {
            submitScore('Alice', 80, 'a', 3);
            const weekly = getWeeklyLeaderboard();
            expect(weekly).toHaveLength(1);
            expect(weekly[0].playerName).toBe('Alice');
        });
    });

    describe('getPlayerRank', () => {
        it('returns nulls when leaderboard empty', () => {
            expect(getPlayerRank('Alice')).toEqual({ rank: null, total: 0, percentile: 0 });
        });

        it('returns rank and percentile for existing player', () => {
            submitScore('Alice', 90, 'a', 3);
            submitScore('Bob', 70, 'b', 3);
            submitScore('Cara', 50, 'c', 3);
            const rank = getPlayerRank('Bob');
            expect(rank.rank).toBe(2);
            expect(rank.total).toBe(3);
            expect(rank.percentile).toBe(33);
        });

        it('returns rank null when player not in board but others are', () => {
            submitScore('Alice', 90, 'a', 3);
            const r = getPlayerRank('Ghost');
            expect(r.rank).toBeNull();
            expect(r.total).toBe(1);
        });
    });

    describe('getPlayerBest', () => {
        it('returns default when no entries exist', () => {
            expect(getPlayerBest('Alice')).toEqual({ bestScore: null, bestRank: null, totalPlayers: 0 });
        });

        it('returns best score, rank, totalPlayers', () => {
            submitScore('Alice', 80, 'a', 3);
            submitScore('Alice', 95, 'a', 3);
            submitScore('Bob', 85, 'b', 3);
            const best = getPlayerBest('Alice');
            expect(best.bestScore).toBe(95);
            expect(best.bestRank).toBe(1);
            expect(best.totalPlayers).toBe(2);
        });
    });

    describe('clearOldEntries', () => {
        it('removes old entries and returns count removed', () => {
            const old = {
                playerName: 'Old',
                score: 50,
                avatar: 'x',
                roundCount: 1,
                trusted: false,
                timestamp: Date.now() - 40 * 24 * 60 * 60 * 1000,
                dateKey: '2020-01-01',
                weekKey: '2020-W01',
            };
            const fresh = {
                playerName: 'Fresh',
                score: 60,
                avatar: 'x',
                roundCount: 1,
                trusted: false,
                timestamp: Date.now(),
                dateKey: getTodayKey(),
                weekKey: getWeekKey(),
            };
            localStorage.setItem('vwf_leaderboard', JSON.stringify([old, fresh]));
            const removed = clearOldEntries();
            expect(removed).toBe(1);
            const remaining = JSON.parse(localStorage.getItem('vwf_leaderboard'));
            expect(remaining).toHaveLength(1);
        });
    });

    describe('seasonal leaderboard', () => {
        it('getCurrentSeason returns id, name, and startDate', () => {
            const s = getCurrentSeason();
            expect(s.id).toMatch(/^\d{4}-\d+$/);
            expect(typeof s.name).toBe('string');
            expect(s.startDate instanceof Date).toBe(true);
        });

        it('submitSeasonalScore adds then updates player entries', () => {
            submitSeasonalScore('Alice', 70, 'a');
            submitSeasonalScore('Alice', 90, 'a');
            submitSeasonalScore('Bob', 50, 'b');
            const board = getSeasonalLeaderboard();
            const alice = board.find((e) => e.name === 'Alice');
            expect(alice.bestScore).toBe(90);
            expect(alice.totalRounds).toBe(2);
            expect(alice.totalScore).toBe(160);
            expect(board[0].name).toBe('Alice');
        });

        it('getSeasonArchive lists all season keys in localStorage', () => {
            submitSeasonalScore('Alice', 70, 'a');
            localStorage.setItem('venn_leaderboard_2020-1', JSON.stringify([{ name: 'OldFoo' }]));
            const archive = getSeasonArchive();
            expect(archive.length).toBeGreaterThanOrEqual(2);
            expect(archive.some((a) => a.seasonId === '2020-1')).toBe(true);
        });
    });
});
