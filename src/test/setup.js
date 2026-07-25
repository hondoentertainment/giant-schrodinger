import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';

// Unit tests use mock Gemini unless explicitly opted in (avoids .env.local pollution).
if (process.env.VITEST_USE_GEMINI !== '1') {
    delete process.env.VITE_GEMINI_API_KEY;
}

// Mock window.location for share service tests, synced with history URL updates
const mockLocation = {
    origin: 'http://localhost:5173',
    pathname: '/',
    hash: '',
    search: '',
};

function syncMockLocationFromUrl(url) {
    if (url == null) return;
    const parsed = new URL(String(url), mockLocation.origin);
    mockLocation.pathname = parsed.pathname;
    mockLocation.search = parsed.search;
    mockLocation.hash = parsed.hash;
}

Object.defineProperty(window, 'location', {
    value: {
        get origin() {
            return mockLocation.origin;
        },
        get pathname() {
            return mockLocation.pathname;
        },
        get hash() {
            return mockLocation.hash;
        },
        set hash(val) {
            mockLocation.hash = val;
        },
        get search() {
            return mockLocation.search;
        },
        set search(val) {
            mockLocation.search = val;
        },
        get href() {
            return `${mockLocation.origin}${mockLocation.pathname}${mockLocation.search}${mockLocation.hash}`;
        },
    },
    writable: true,
});

const originalPushState = window.history.pushState.bind(window.history);
const originalReplaceState = window.history.replaceState.bind(window.history);
window.history.pushState = (state, title, url) => {
    syncMockLocationFromUrl(url);
    return originalPushState(state, title, url);
};
window.history.replaceState = (state, title, url) => {
    syncMockLocationFromUrl(url);
    return originalReplaceState(state, title, url);
};

if (typeof HTMLCanvasElement !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null);
    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/jpeg;base64,dGVzdA==');
}

// Reset localStorage between tests to avoid cross-test pollution
beforeEach(() => {
    localStorage.clear();
    mockLocation.pathname = '/';
    mockLocation.hash = '';
    mockLocation.search = '';
});
