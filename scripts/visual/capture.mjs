// Visual comparison harness: captures the mockup screens and the app (web export),
// then builds mockup | app side-by-side images.
//
// PLAYWRIGHT_PATH=<dir containing node_modules/playwright> \
// CHROMIUM_PATH=<chromium binary, optional> \
// node scripts/visual/capture.mjs [--skip-export]
//
// Output: .agents/tasks/MFA-004/shots/{mockup,app,compare}-<screen>.png
import { execSync } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const outDir = join(root, '.agents/tasks/MFA-004/shots');
const webDir = '/tmp/mfa004-web';
const mockupUrl = `file://${join(root, 'docs/mockup/index.html')}`;
const viewport = { width: 390, height: 844 };
const scale = 2;

// Fixed clock: "today" is 19 Oct 2026 (mockup content), so the day-based content matches.
const FIXED_TIME = '2026-10-19T09:45:00';

// name, mockup frame index, app route, optional actions (click selectors) before capture
const SCREENS = [
  { name: 'home', frame: 0, route: '/' },
  { name: 'card', frame: 1, route: '/card' },
  { name: 'card-back', frame: 2, route: '/card', action: { click: '[data-testid="action-flip"]', wait: 1200 } },
  { name: 'abundance', frame: 3, route: '/abundance' },
  { name: 'keypad-send', frame: 4, route: '/keypad?mode=send&contact=gratitude', clicks: ['keypad-2', 'keypad-5', 'keypad-0'] },
  { name: 'history', frame: 5, route: '/history' },
  { name: 'settings', frame: 6, route: '/settings' },
];

// Same demo data as the mockup (balance 186 420,50 EUR, card 8402 1587 3306 9914).
const DEMO_STATE = {
  state: {
    balanceMinor: 18642050,
    currency: 'EUR',
    language: 'fr',
    holderName: 'ÉLISE ADJOVI',
    card: { number: '8402158733069914', expiry: '10/30', cvv: '417' },
    userTransactions: [],
  },
  version: 1,
};

// Mockup figures that cannot be derived from transactions. Read by src/dev/visualFixture.ts,
// which only exposes it when the export is built with EXPO_PUBLIC_VISUAL_FIXTURE=1.
// Transaction dates are local time strings, converted in the page.
const VISUAL_FIXTURE = {
  transactions: [
    { kind: 'receive', labelKey: 'content:intentions.universeGratitude', amountMinor: 250000, at: '2026-10-19T09:41:00' },
    { kind: 'send', labelKey: 'content:intentions.sharedWith', labelParams: { contact: 'family' }, amountMinor: 40000, at: '2026-10-19T08:12:00' },
    { kind: 'pay', labelKey: 'content:intentions.dreamProject', amountMinor: 120000, at: '2026-10-18T18:30:00' },
    { kind: 'receive', labelKey: 'content:intentions.futureSelfAbundance', amountMinor: 310000, at: '2026-10-18T10:05:00' },
    { kind: 'withdraw', labelKey: 'content:intentions.tripWithdrawal', amountMinor: 30000, at: '2026-10-16T15:22:00' },
  ],
  dailyDelta: { amountMinor: 841200, percent: 4.73 },
  kindShares: { receive: 45, send: 25, pay: 18, withdraw: 12 },
  monthly: [
    { in: 46, out: 22 },
    { in: 58, out: 30 },
    { in: 40, out: 26 },
    { in: 72, out: 34 },
    { in: 64, out: 20 },
    { in: 88, out: 38 },
  ],
};

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

function loadPlaywright() {
  const base = process.env.PLAYWRIGHT_PATH;
  if (!base) throw new Error('PLAYWRIGHT_PATH is required (dir containing node_modules/playwright)');
  return createRequire(join(base, 'noop.js'))('playwright');
}

function serve(dir) {
  const server = createServer((req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    const candidates = [join(dir, path), join(dir, `${path}.html`), join(dir, path, 'index.html'), join(dir, 'index.html')];
    const file = candidates.find((c) => c.startsWith(dir) && existsSync(c) && statSync(c).isFile());
    if (!file) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server)));
}

async function captureMockup(browser) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: scale });
  await page.goto(mockupUrl);
  await page.addStyleTag({ content: '.phone{border:0!important;border-radius:0!important;box-shadow:none!important}' });
  await page.evaluate(() => document.fonts.ready);
  const phones = page.locator('.screens .phone');
  for (const s of SCREENS) {
    await phones.nth(s.frame).screenshot({ path: join(outDir, `mockup-${s.name}.png`) });
  }
  await page.close();
}

async function captureApp(browser, origin) {
  for (const s of SCREENS) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale, locale: 'fr-FR' });
    await ctx.clock.setFixedTime(new Date(FIXED_TIME));
    await ctx.addInitScript((state) => localStorage.setItem('abonda-store-v1', JSON.stringify(state)), DEMO_STATE);
    await ctx.addInitScript((fixture) => {
      const transactions = fixture.transactions.map(({ at, ...tx }, index) => ({
        ...tx,
        id: `fixture-${index + 1}`,
        createdAt: new Date(at).toISOString(),
      }));
      globalThis.__ABONDA_VISUAL_FIXTURE__ = { ...fixture, transactions };
    }, VISUAL_FIXTURE);
    const page = await ctx.newPage();
    await page.goto(origin + s.route, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    for (const id of s.clicks ?? []) await page.click(`[data-testid="${id}"]`);
    if (s.action) {
      await page.click(s.action.click);
      await page.waitForTimeout(s.action.wait);
    }
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(outDir, `app-${s.name}.png`) });
    await ctx.close();
  }
}

async function compare(browser) {
  const page = await browser.newPage({ viewport: { width: 790, height: 844 }, deviceScaleFactor: scale });
  for (const s of SCREENS) {
    const img = (p) => `data:image/png;base64,${readFileSync(join(outDir, p)).toString('base64')}`;
    await page.setContent(
      `<body style="margin:0;display:flex;gap:10px;background:#888"><img src="${img(`mockup-${s.name}.png`)}" width="390" height="844"><img src="${img(`app-${s.name}.png`)}" width="390" height="844"></body>`,
    );
    await page.waitForFunction(() => [...document.images].every((i) => i.complete));
    await page.screenshot({ path: join(outDir, `compare-${s.name}.png`) });
  }
  await page.close();
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  if (!process.argv.includes('--skip-export')) {
    execSync(`CI=1 EXPO_PUBLIC_VISUAL_FIXTURE=1 npx expo export --platform web --output-dir ${webDir}`, { cwd: root, stdio: 'inherit' });
  }
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const server = await serve(webDir);
  try {
    await captureMockup(browser);
    await captureApp(browser, `http://127.0.0.1:${server.address().port}`);
    await compare(browser);
  } finally {
    await browser.close();
    server.close();
  }
  console.log(`Shots written to ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
