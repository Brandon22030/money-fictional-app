// Generates the Abonda brand assets (SVG then PNG), plus 3 exploration tracks.
// Usage: PLAYWRIGHT_PATH=<dir containing node_modules/playwright> CHROMIUM_PATH=<optional chromium binary> node assets/brand/build.mjs
// Tokens: goldLight #F5E6BC, goldBase #D8B769, goldDeep #A67C2E, sky #CFE7FC to #7DB8F0, marine #2C5A96 to #0B1F40.
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(process.env.PLAYWRIGHT_PATH ?? here, 'noop.js'));
const { chromium } = require('playwright');

const defs = `<defs>
  <linearGradient id="bg" x1="0.25" y1="0" x2="0.75" y2="1">
    <stop offset="0" stop-color="#CFE7FC"/><stop offset="0.38" stop-color="#7DB8F0"/>
    <stop offset="0.75" stop-color="#2C5A96"/><stop offset="1" stop-color="#0B1F40"/>
  </linearGradient>
  <radialGradient id="bgGlow" cx="0.5" cy="0.36" r="0.55">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.7"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="gold" x1="0.15" y1="0" x2="0.85" y2="1">
    <stop offset="0" stop-color="#F5E6BC"/><stop offset="0.5" stop-color="#D8B769"/><stop offset="1" stop-color="#A67C2E"/>
  </linearGradient>
  <linearGradient id="goldRev" x1="0.15" y1="0" x2="0.85" y2="1">
    <stop offset="0" stop-color="#A67C2E"/><stop offset="0.55" stop-color="#D8B769"/><stop offset="1" stop-color="#F5E6BC"/>
  </linearGradient>
  <radialGradient id="rim" cx="0.35" cy="0.25" r="0.95">
    <stop offset="0" stop-color="#FBF1D2"/><stop offset="0.5" stop-color="#D8B769"/><stop offset="1" stop-color="#8F6A25"/>
  </radialGradient>
  <radialGradient id="face" cx="0.36" cy="0.26" r="0.9">
    <stop offset="0" stop-color="#FBF1D2"/><stop offset="0.55" stop-color="#E4C985"/><stop offset="1" stop-color="#C39A48"/>
  </radialGradient>
  <radialGradient id="sun" cx="0.4" cy="0.3" r="0.85">
    <stop offset="0" stop-color="#FFF8DD"/><stop offset="0.55" stop-color="#F5E6BC"/><stop offset="1" stop-color="#D8B769"/>
  </radialGradient>
  <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0.3" stop-color="#FFF1BF" stop-opacity="0.85"/><stop offset="1" stop-color="#FFF1BF" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.8"/><stop offset="1" stop-color="#DCEBFA" stop-opacity="0.22"/>
  </linearGradient>
  <linearGradient id="glassEdge" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.95"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0.2"/>
  </linearGradient>
  <filter id="blur18" x="-60%" y="-300%" width="220%" height="700%"><feGaussianBlur stdDeviation="18"/></filter>
  <filter id="blur8" x="-60%" y="-300%" width="220%" height="700%"><feGaussianBlur stdDeviation="8"/></filter>
  <filter id="blur4" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>
</defs>`;

// Geometric "A" centered near (0,0): apex (0,-140), feet (+-118,128).
const aPath = (top = -140, foot = 128, half = 118, bar = 38) => {
  const k = half / (foot - top);
  const x = (y) => (y - top) * k;
  return `M${-half} ${foot} L0 ${top} L${half} ${foot} M${-x(bar)} ${bar} H${x(bar)}`;
};

// Each emblem is centered on (0,0) and fits in about 640 units (halo included).
const emblems = {
  // a) rising sun behind a frosted-glass mound whose silhouette (arch cutout) reads as an "A".
  sunrise: `<g>
  <circle cy="-20" r="330" fill="url(#halo)"/>
  <circle cy="-30" r="190" fill="url(#sun)"/>
  <ellipse cx="-66" cy="-120" rx="84" ry="34" transform="rotate(-28 -66 -120)" fill="#FFFFFF" opacity="0.55" filter="url(#blur8)"/>
  <ellipse cy="250" rx="260" ry="22" fill="#0B1F40" opacity="0.3" filter="url(#blur18)"/>
  <path fill="url(#glass)" stroke="url(#glassEdge)" stroke-width="5" opacity="0.95"
    d="M-310 250 C-310 170 -250 140 -190 160 C-150 90 -60 80 0 120 C60 80 150 90 190 160 C250 140 310 170 310 250 Z"/>
  <path d="M-190 160 C-150 90 -60 80 0 120 C60 80 150 90 190 160" fill="none" stroke="#FFFFFF" stroke-opacity="0.9" stroke-width="5" stroke-linecap="round" filter="url(#blur4)"/>
  <path d="M-250 238 C-150 262 150 262 250 238" fill="none" stroke="url(#gold)" stroke-width="5" stroke-linecap="round" opacity="0.85"/>
</g>`,
  // b) volumetric gold coin struck with a fine geometric "A" and a luminous halo.
  coin: `<g>
  <circle r="330" fill="url(#halo)"/>
  <ellipse cy="300" rx="190" ry="30" fill="#0B1F40" opacity="0.38" filter="url(#blur18)"/>
  <circle r="276" fill="url(#rim)"/>
  <circle r="276" fill="none" stroke="#FFF8DA" stroke-opacity="0.75" stroke-width="5"/>
  <circle r="232" fill="url(#face)"/>
  <circle r="232" fill="none" stroke="#8F6A25" stroke-opacity="0.45" stroke-width="4"/>
  <circle r="216" fill="none" stroke="#FFF8DA" stroke-opacity="0.55" stroke-width="2"/>
  <ellipse cx="-90" cy="-158" rx="120" ry="46" transform="rotate(-28 -90 -158)" fill="#FFFFFF" opacity="0.6" filter="url(#blur8)"/>
  <path d="${aPath()}" transform="translate(0 7)" fill="none" stroke="#FFF8DA" stroke-opacity="0.8" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${aPath()}" transform="translate(0 -3)" fill="none" stroke="#6E4E16" stroke-opacity="0.55" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${aPath()}" fill="none" stroke="url(#goldRev)" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
</g>`,
  // c) glass and gold "A" monogram standing on a luminous horizon arc, private-bank emblem style.
  horizon: `<g>
  <circle cy="40" r="320" fill="url(#halo)" opacity="0.5"/>
  <path d="M-330 215 A 700 700 0 0 1 330 215 A 330 80 0 0 1 -330 215 Z" fill="url(#glass)" opacity="0.55"/>
  <path d="M-330 215 A 700 700 0 0 1 330 215" fill="none" stroke="url(#gold)" stroke-width="14" stroke-linecap="round" filter="url(#blur8)" opacity="0.9"/>
  <path d="M-330 215 A 700 700 0 0 1 330 215" fill="none" stroke="url(#gold)" stroke-width="8" stroke-linecap="round"/>
  <ellipse cy="130" rx="150" ry="22" fill="#0B1F40" opacity="0.3" filter="url(#blur18)"/>
  <path d="${aPath(-190, 134, 150, 40)}" transform="translate(0 8)" fill="none" stroke="#0B1F40" stroke-opacity="0.55" stroke-width="58" stroke-linecap="round" stroke-linejoin="round" filter="url(#blur8)"/>
  <path d="${aPath(-190, 134, 150, 40)}" fill="none" stroke="url(#goldRev)" stroke-width="54" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${aPath(-190, 134, 150, 40)}" fill="none" stroke="url(#glass)" stroke-width="38" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M-8 -150 L-128 118" fill="none" stroke="#FFFFFF" stroke-opacity="0.8" stroke-width="5" stroke-linecap="round"/>
</g>`,
};

const svg = (w, h, body, extraDefs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">\n${defs.replace('</defs>', `${extraDefs}</defs>`)}\n${body}\n</svg>\n`;

const FINAL = 'coin';
const iconBody = (em, rx) => `<rect width="1024" height="1024" rx="${rx}" fill="url(#bg)"/>
<rect width="1024" height="1024" rx="${rx}" fill="url(#bgGlow)"/>
<g transform="translate(512 520) scale(1.12)">${em}</g>`;

const files = {};
const shots = [];
const explorations = ['sunrise', 'coin', 'horizon'];
mkdirSync(join(here, 'explorations'), { recursive: true });
explorations.forEach((name, i) => {
  const id = `${'abc'[i]}-${name}`;
  files[`explorations/${id}.svg`] = svg(1024, 1024, iconBody(emblems[name], 232));
  // Only the validated direction (b-coin) keeps a PNG export; the others stay as SVG sources.
  if (name === 'coin') shots.push([`explorations/${id}.svg`, `explorations/${id}.png`, 1024, 1024, true]);
});

const em = emblems[FINAL];
files['logo.svg'] = svg(1024, 1024, iconBody(em, 232));
files['icon-full.svg'] = svg(1024, 1024, iconBody(em, 0));
// Emblem spans 640 units; the safe zone is 66 percent of 1024 (676px), so scale 1.0 fits.
files['adaptive.svg'] = svg(1024, 1024, `<g transform="translate(512 512) scale(1.0)">${em}</g>`);
files['logo-mark.svg'] = svg(256, 256, `<g transform="translate(128 128) scale(0.38)">${em}</g>`);
// Flat gold monogram for use on the navy card (no squircle).
files['logo-gold.svg'] = svg(256, 256, `<g transform="translate(128 128) scale(0.8)">
<path d="${aPath(-112, 100, 94, 30)}" fill="none" stroke="url(#gold)" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
<circle r="200" fill="none" stroke="url(#gold)" stroke-width="10"/></g>`);

for (const [name, content] of Object.entries(files)) writeFileSync(join(here, name), content);

shots.push(
  ['icon-full.svg', 'icon.png', 1024, 1024, false],
  ['adaptive.svg', 'adaptive-icon.png', 1024, 1024, true],
  // Splash: the logo mark rendered large enough to stay sharp at imageWidth 200 on 3x screens.
  ['logo-mark.svg', 'splash-icon.png', 1024, 1024, true],
  ['icon-full.svg', 'favicon.png', 48, 48, false],
  ['logo-mark.svg', 'logo-mark.png', 256, 256, true],
);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
for (const [src, out, w, h, transparent] of shots) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${w}px;height:${h}px}</style>${files[src]}`);
  await page.screenshot({ path: join(here, out), omitBackground: transparent });
  await page.close();
}
await browser.close();
