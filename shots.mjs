import { chromium } from '/home/hatch/workspace/makefun/threejs-fps-01-work/node_modules/playwright/index.mjs';
import fs from 'fs';

const shots = [
  { mode: 'play', filename: '1-play.png' },
  { mode: 'start', filename: '2-start.png' },
  { mode: 'buy', filename: '3-buy.png' },
  { mode: 'end', filename: '4-end.png' }
];

(async () => {
  if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots', { recursive: true });
  }

  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--no-sandbox']
  });

  for (const shot of shots) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    const requests = [];

    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('request', req => {
      const url = req.url();
      if (!url.includes('localhost:8080')) requests.push(url);
    });

    await page.goto(`http://localhost:8080/?shot=${shot.mode}`);
    try {
      await page.waitForFunction(() => window.__shotReady === true, { timeout: 10000 });
      await page.waitForTimeout(1000);
    } catch (e) {
      console.error(`Timeout waiting for shot=${shot.mode}`);
    }

    if (errors.length > 0) {
      console.error(`Errors in ${shot.mode}:`, errors);
      process.exit(1);
    }
    if (requests.length > 0) {
      console.error(`External requests in ${shot.mode}:`, requests);
      process.exit(1);
    }

    const outPath = `screenshots/${shot.filename}`;
    await page.screenshot({ path: outPath });
    console.log(`Captured ${outPath}`);
    await page.close();
  }

  await browser.close();
})();
