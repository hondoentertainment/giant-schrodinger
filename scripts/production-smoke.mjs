import { chromium } from '@playwright/test';

const productionUrl = process.env.PRODUCTION_URL || 'https://giant-schrodinger.vercel.app';

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  await page.goto(productionUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByRole('heading', { name: /VENN/i }).waitFor({ state: 'visible', timeout: 10000 });
  await page.getByPlaceholder(/Enter your name/i).waitFor({ state: 'visible', timeout: 10000 });
  const title = await page.title();
  console.log(`Production smoke passed: ${productionUrl} (${title})`);
} finally {
  await browser.close();
}
