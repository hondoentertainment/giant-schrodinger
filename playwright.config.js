import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4173';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
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
    webServer: process.env.PLAYWRIGHT_BASE_URL
        ? undefined
        : {
              command: 'npm run build && npm run preview',
              url: baseURL,
              reuseExistingServer: !process.env.CI,
              timeout: 120000,
          },
});
