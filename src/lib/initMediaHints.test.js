import { describe, it, expect, beforeEach } from 'vitest';
import { initMediaHints, _resetMediaHintsInit } from './initMediaHints';

describe('initMediaHints', () => {
    beforeEach(() => {
        _resetMediaHintsInit();
        document.head.innerHTML = '';
    });

    it('injects preconnect links for media CDNs', () => {
        initMediaHints();

        expect(document.querySelector('link[rel="preconnect"][href="https://media.giphy.com"]')).toBeTruthy();
        expect(document.querySelector('link[rel="preconnect"][href="https://images.pexels.com"]')).toBeTruthy();
    });

    it('is idempotent', () => {
        initMediaHints();
        initMediaHints();
        expect(document.querySelectorAll('link[rel="preconnect"]').length).toBeGreaterThan(0);
    });
});
