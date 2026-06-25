import { defineConfig, devices } from '@playwright/test';

const previewPort = process.env.PLAYWRIGHT_PORT || '4174';
const deployedUrl = process.env.PRODUCTION_URL;
const baseURL = process.env.PLAYWRIGHT_BASE_URL || deployedUrl || `http://localhost:${previewPort}`;
const useLocalServer = !process.env.PLAYWRIGHT_BASE_URL && !deployedUrl;

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    // Keep local e2e stable on file-syncing workspaces where parallel web builds
    // and browser workers can contend for the same dist/test artifacts.
    workers: process.env.CI ? 1 : 2,
    reporter: process.env.CI ? 'dot' : 'html',
    use: {
        baseURL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
    },
    projects: [
        { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
        { name: 'Desktop Firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'Mobile Safari', use: { ...devices['iPhone 14'] } },
    ],
    webServer: useLocalServer
        ? {
              command: `npm run build:e2e && npm run preview -- --port ${previewPort} --strictPort`,
              url: baseURL,
              reuseExistingServer: false,
              timeout: 120000,
          }
        : undefined,
});
