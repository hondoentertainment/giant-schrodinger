import '@testing-library/jest-dom';
import { vi } from 'vitest';

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

// Reset localStorage between tests to avoid cross-test pollution
beforeEach(() => {
    localStorage.clear();
});
