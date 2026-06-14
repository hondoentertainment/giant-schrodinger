import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
    generateReferralCode,
    trackReferral,
    getReferralStats,
    checkReferralReward,
    trackReferralConversion,
    getReferralCohorts,
    parseReferralFromUrl,
    hasReferralBonus,
    claimReferralBonus,
} from './referrals';

describe('referrals service', () => {
    beforeEach(() => {
        localStorage.clear();
        // Reset window.location.search between tests
        window.location.search = '';
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    describe('generateReferralCode', () => {
        it('creates a 6-char alphanumeric code for a new player', () => {
            const code = generateReferralCode('Alice');
            expect(code).toMatch(/^[A-Za-z0-9]{6}$/);
        });

        it('returns the same code on subsequent calls', () => {
            const first = generateReferralCode('Alice');
            const second = generateReferralCode('Alice');
            expect(first).toBe(second);
        });

        it('persists the player name alongside the code', () => {
            generateReferralCode('Alice');
            const raw = JSON.parse(localStorage.getItem('vwf_referrals'));
            expect(raw.playerName).toBe('Alice');
            expect(raw.myReferralCode).toMatch(/^[A-Za-z0-9]{6}$/);
        });
    });

    describe('trackReferral', () => {
        it('rejects invalid inputs', () => {
            expect(trackReferral('')).toBe(false);
            expect(trackReferral(null)).toBe(false);
            expect(trackReferral(42)).toBe(false);
        });

        it('records a referral event and sets joinedViaCode', () => {
            expect(trackReferral('ABC123')).toBe(true);
            const data = JSON.parse(localStorage.getItem('vwf_referrals'));
            expect(data.referrals).toHaveLength(1);
            expect(data.referrals[0].code).toBe('ABC123');
            expect(data.joinedViaCode).toBe('ABC123');
            expect(data.bonusClaimed).toBe(false);
        });

        it('preserves the first joinedViaCode when called again', () => {
            trackReferral('FIRST1');
            trackReferral('SECOND');
            const data = JSON.parse(localStorage.getItem('vwf_referrals'));
            expect(data.joinedViaCode).toBe('FIRST1');
            expect(data.referrals).toHaveLength(2);
        });
    });

    describe('getReferralStats / checkReferralReward', () => {
        it('returns zeros for a fresh player', () => {
            const stats = getReferralStats();
            expect(stats).toEqual({ totalReferred: 0, bonusPointsEarned: 0, referralCode: null });
            expect(checkReferralReward()).toBe(0);
        });

        it('counts referrals and caps reward at 5', () => {
            // Manually seed 7 referrals
            localStorage.setItem('vwf_referrals', JSON.stringify({
                referrals: Array.from({ length: 7 }, (_, i) => ({ code: `R${i}`, timestamp: '' })),
                myReferralCode: 'MINE01',
            }));
            const stats = getReferralStats();
            expect(stats.totalReferred).toBe(7);
            expect(stats.bonusPointsEarned).toBe(250); // capped at 5 * 50
            expect(stats.referralCode).toBe('MINE01');
            expect(checkReferralReward()).toBe(250);
        });
    });

    describe('trackReferralConversion / getReferralCohorts', () => {
        it('creates a cohort entry and increments rounds', () => {
            trackReferralConversion('ABC123');
            trackReferralConversion('ABC123');
            const cohorts = getReferralCohorts();
            expect(cohorts.ABC123.rounds).toBe(2);
            expect(cohorts.ABC123.d1).toBe(false);
            expect(cohorts.ABC123.d7).toBe(false);
        });

        it('rejects invalid codes without writing storage', () => {
            trackReferralConversion('');
            trackReferralConversion(null);
            expect(localStorage.getItem('venn_referral_cohorts')).toBeNull();
        });

        it('sets d1/d7 flags when firstSeen is old enough', () => {
            const oldTime = Date.now() - 8 * 86400000;
            localStorage.setItem('venn_referral_cohorts', JSON.stringify({
                CODE01: { firstSeen: oldTime, rounds: 0, d1: false, d7: false },
            }));
            trackReferralConversion('CODE01');
            const cohorts = getReferralCohorts();
            expect(cohorts.CODE01.d1).toBe(true);
            expect(cohorts.CODE01.d7).toBe(true);
        });
    });

    describe('parseReferralFromUrl', () => {
        it('returns null when no ref param', () => {
            window.location.search = '';
            expect(parseReferralFromUrl()).toBeNull();
        });

        it('returns the trimmed ref code when present', () => {
            window.location.search = '?ref=  CODE42  ';
            expect(parseReferralFromUrl()).toBe('CODE42');
        });

        it('returns null when ref is empty or whitespace', () => {
            window.location.search = '?ref=';
            expect(parseReferralFromUrl()).toBeNull();
            window.location.search = '?ref=   ';
            expect(parseReferralFromUrl()).toBeNull();
        });
    });

    describe('hasReferralBonus / claimReferralBonus', () => {
        it('returns false when player did not join via a code', () => {
            expect(hasReferralBonus()).toBe(false);
            expect(claimReferralBonus()).toBe(0);
        });

        it('claims exactly once and returns 50 points', () => {
            trackReferral('FRIEND1');
            expect(hasReferralBonus()).toBe(true);
            expect(claimReferralBonus()).toBe(50);
            expect(hasReferralBonus()).toBe(false);
            // Second claim is a no-op
            expect(claimReferralBonus()).toBe(0);
        });
    });
});
