import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const useLiveGemini = process.env.VITEST_USE_GEMINI === '1';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.js'],
        include: ['src/**/*.{test,spec}.{js,jsx}'],
        exclude: ['node_modules', 'dist', 'e2e'],
        testTimeout: 15000,
        env: {
            // Prevent .env.local from triggering slow live Gemini calls in unit tests.
            VITE_GEMINI_API_KEY: useLiveGemini ? (process.env.VITE_GEMINI_API_KEY ?? '') : '',
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            include: ['src/**/*.{js,jsx}'],
            exclude: [
                'src/test/**',
                'src/main.jsx',
                '**/*.config.js',
                '**/index.js',
            ],
        },
    },
});
