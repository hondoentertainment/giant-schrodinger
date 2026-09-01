import { describe, expect, it } from 'vitest';
import {
    CANONICAL_ORIGIN,
    getCanonicalUrl,
    getOgImageUrl,
    getShareAppBase,
    isLegacyPublicHost,
} from './siteIdentity';

describe('siteIdentity', () => {
    it('points the public site at Vercel, not GitHub Pages', () => {
        expect(CANONICAL_ORIGIN).toBe('https://giant-schrodinger.vercel.app');
        expect(getCanonicalUrl()).toBe('https://giant-schrodinger.vercel.app/');
        expect(getOgImageUrl()).toBe('https://giant-schrodinger.vercel.app/og-image.png');
        expect(isLegacyPublicHost('hondoentertainment.github.io')).toBe(true);
        expect(isLegacyPublicHost('giant-schrodinger.vercel.app')).toBe(false);
    });

    it('rewrites GitHub Pages share links to the canonical app', () => {
        expect(getShareAppBase({
            hostname: 'hondoentertainment.github.io',
            origin: 'https://hondoentertainment.github.io',
            pathname: '/giant-schrodinger/',
        })).toBe('https://giant-schrodinger.vercel.app/');
    });

    it('keeps local and Vercel share links on the current host', () => {
        expect(getShareAppBase({
            hostname: 'localhost',
            origin: 'http://localhost:5173',
            pathname: '/',
        })).toBe('http://localhost:5173/');
        expect(getShareAppBase({
            hostname: 'giant-schrodinger.vercel.app',
            origin: 'https://giant-schrodinger.vercel.app',
            pathname: '/',
        })).toBe('https://giant-schrodinger.vercel.app/');
    });
});
