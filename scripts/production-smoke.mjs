import { chromium } from '@playwright/test';
import { loadEnvFiles } from './load-env.mjs';

loadEnvFiles();

const productionUrl = process.env.PRODUCTION_URL || 'https://giant-schrodinger.vercel.app';

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  await page.goto(productionUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.getByRole('heading', { name: /VENN/i }).waitFor({ state: 'visible', timeout: 15000 });
  await page.getByPlaceholder(/Enter your name/i).waitFor({ state: 'visible', timeout: 10000 });
  const title = await page.title();
  console.log(`Production smoke passed: ${productionUrl} (${title})`);
  console.log('Tip: PRODUCTION_URL=<url> npm run test:e2e:rehearsal for deeper deployed checks.');
} finally {
  await browser.close();
}
