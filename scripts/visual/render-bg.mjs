// Renders the mockup background (.bg: sky gradient, blurred waves, light veil) to assets/visual/sky-bg.png.
//
// PLAYWRIGHT_PATH=<dir containing node_modules/playwright> \
// CHROMIUM_PATH=<chromium binary, optional> \
// node scripts/visual/render-bg.mjs
//
// The committed PNG is then reduced to a 256-colour palette (max 3/255 per channel on this
// smooth gradient, no visible loss), for example with Pillow:
// python3 -c "from PIL import Image; Image.open('assets/visual/sky-bg.png').quantize(256, dither=Image.Dither.NONE).save('assets/visual/sky-bg.png', optimize=True)"
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const mockupUrl = `file://${join(root, 'docs/mockup/index.html')}`;
const outFile = join(root, 'assets/visual/sky-bg.png');

function loadPlaywright() {
  const base = process.env.PLAYWRIGHT_PATH;
  if (!base) throw new Error('PLAYWRIGHT_PATH is required (dir containing node_modules/playwright)');
  return createRequire(join(base, 'noop.js'))('playwright');
}

async function main() {
  mkdirSync(join(root, 'assets/visual'), { recursive: true });
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 3 });
    const page = await ctx.newPage();
    await page.goto(mockupUrl, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: '.phone{border:0!important;border-radius:0!important;box-shadow:none!important}.phone>:not(.bg){display:none!important}' });
    const box = await page.locator('.phone').first().locator('.bg').boundingBox();
    await page.screenshot({ path: outFile, fullPage: true, clip: { x: Math.round(box.x), y: Math.round(box.y), width: 390, height: 844 } });
    await ctx.close();
  } finally {
    await browser.close();
  }
  console.log(`wrote ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
