import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    addFriend,
    removeFriend,
    getFriends,
    isFriend,
    getFriendActivity,
} from './friends';

describe('friends service', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    describe('addFriend', () => {
        it('adds a friend and persists to localStorage', () => {
            expect(addFriend('Alice')).toBe(true);
            const stored = JSON.parse(localStorage.getItem('vwf_friends'));
            expect(stored).toHaveLength(1);
            expect(stored[0].name).toBe('Alice');
            expect(typeof stored[0].addedAt).toBe('number');
        });

        it('returns false for falsy or non-string name', () => {
            expect(addFriend('')).toBe(false);
            expect(addFriend(null)).toBe(false);
            expect(addFriend(123)).toBe(false);
            expect(addFriend('   ')).toBe(false);
        });

        it('returns false when friend already exists (case-insensitive)', () => {
            addFriend('Alice');
            expect(addFriend('alice')).toBe(false);
            expect(getFriends()).toHaveLength(1);
        });

        it('trims whitespace from name before storing', () => {
            addFriend('  Bob  ');
            expect(getFriends()[0].name).toBe('Bob');
        });
    });

    describe('removeFriend', () => {
        it('removes an existing friend', () => {
            addFriend('Alice');
            addFriend('Bob');
            expect(removeFriend('Alice')).toBe(true);
            const friends = getFriends();
            expect(friends).toHaveLength(1);
            expect(friends[0].name).toBe('Bob');
        });

        it('returns false when friend not found', () => {
            expect(removeFriend('Ghost')).toBe(false);
        });

        it('returns false for invalid input', () => {
            expect(removeFriend('')).toBe(false);
            expect(removeFriend(null)).toBe(false);
        });
    });

    describe('getFriends', () => {
        it('returns empty array when none stored', () => {
            expect(getFriends()).toEqual([]);
        });

        it('returns empty array when stored data is not an array', () => {
            localStorage.setItem('vwf_friends', JSON.stringify({ bogus: true }));
            expect(getFriends()).toEqual([]);
        });

        it('returns empty array on malformed JSON', () => {
            localStorage.setItem('vwf_friends', 'not-json');
            expect(getFriends()).toEqual([]);
        });
    });

    describe('isFriend', () => {
        it('returns true for existing friend (case-insensitive)', () => {
            addFriend('Alice');
            expect(isFriend('ALICE')).toBe(true);
            expect(isFriend('  Alice  ')).toBe(true);
        });

        it('returns false for unknown name', () => {
            expect(isFriend('Ghost')).toBe(false);
        });

        it('returns false for invalid input', () => {
            expect(isFriend('')).toBe(false);
            expect(isFriend(null)).toBe(false);
        });
    });

    describe('getFriendActivity', () => {
        it('returns empty array when no friends', () => {
            expect(getFriendActivity()).toEqual([]);
        });

        it('returns activity entries using existing friend names, sorted desc', () => {
            addFriend('Alice');
            addFriend('Bob');
            const activity = getFriendActivity();
            expect(activity.length).toBeGreaterThan(0);
            const names = new Set(['Alice', 'Bob']);
            activity.forEach((entry) => {
                expect(names.has(entry.friend)).toBe(true);
                expect(typeof entry.message).toBe('string');
                expect(typeof entry.timestamp).toBe('number');
            });
            // Sorted newest first
            for (let i = 1; i < activity.length; i++) {
                expect(activity[i - 1].timestamp).toBeGreaterThanOrEqual(activity[i].timestamp);
            }
        });
    });
});
