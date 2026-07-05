import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';

// Unit tests use mock Gemini unless explicitly opted in (avoids .env.local pollution).
if (process.env.VITEST_USE_GEMINI !== '1') {
    delete process.env.VITE_GEMINI_API_KEY;
}

// Mock window.location for share service tests
const mockLocation = {
    origin: 'http://localhost:5173',
    pathname: '/',
    hash: '',
    search: '',
};
Object.defineProperty(window, 'location', {
    value: {
        ...mockLocation,
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
        replaceState: vi.fn(),
    },
    writable: true,
});

if (typeof HTMLCanvasElement !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null);
    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/jpeg;base64,dGVzdA==');
}

// Reset localStorage between tests to avoid cross-test pollution
beforeEach(() => {
    localStorage.clear();
});
