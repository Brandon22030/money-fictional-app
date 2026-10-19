// Generates the Abonda brand assets (SVG then PNG).
// Usage: PLAYWRIGHT_PATH=<dir containing node_modules/playwright> CHROMIUM_PATH=<optional chromium binary> node assets/brand/build.mjs
import { writeFileSync } from 'node:fs';
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
  <radialGradient id="bgGlow" cx="0.5" cy="0.38" r="0.55">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.75"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="rim" cx="0.35" cy="0.25" r="0.9">
    <stop offset="0" stop-color="#FFF3C9"/><stop offset="0.55" stop-color="#E9CB82"/><stop offset="1" stop-color="#B98F45"/>
  </radialGradient>
  <radialGradient id="face" cx="0.38" cy="0.28" r="0.85">
    <stop offset="0" stop-color="#FFFDF0"/><stop offset="0.5" stop-color="#F8E8B4"/><stop offset="1" stop-color="#E3C375"/>
  </radialGradient>
  <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0.45" stop-color="#FFF1BF" stop-opacity="0.9"/><stop offset="1" stop-color="#FFF1BF" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="eye" cx="0.4" cy="0.3" r="0.85">
    <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#DCE8F5"/>
  </radialGradient>
  <filter id="blur18" x="-60%" y="-300%" width="220%" height="700%"><feGaussianBlur stdDeviation="18"/></filter>
  <filter id="blur40" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>
  <filter id="blur8" x="-60%" y="-300%" width="220%" height="700%"><feGaussianBlur stdDeviation="8"/></filter>
</defs>`;

const star = (x, y, s, o) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -40 C4 -12 12 -4 40 0 C12 4 4 12 0 40 C-4 12 -12 4 -40 0 C-12 -4 -4 -12 0 -40Z" fill="#FFFFFF" opacity="${o}"/>`;

// Mascot centered on (0,0), about 640 units wide including the halo.
const mascot = `<g>
  <circle r="320" fill="url(#halo)"/>
  <ellipse cx="0" cy="300" rx="190" ry="34" fill="#0B1F40" opacity="0.38" filter="url(#blur18)"/>
  <circle r="278" fill="url(#rim)"/>
  <circle r="278" fill="none" stroke="#FFF8DA" stroke-opacity="0.7" stroke-width="5"/>
  <circle r="238" fill="url(#face)"/>
  <circle r="238" fill="none" stroke="#C99F52" stroke-opacity="0.45" stroke-width="5"/>
  <ellipse cx="-92" cy="-150" rx="118" ry="52" transform="rotate(-28 -92 -150)" fill="#FFFFFF" opacity="0.7" filter="url(#blur8)"/>
  <ellipse cx="0" cy="236" rx="150" ry="26" fill="#C99F52" opacity="0.28" filter="url(#blur18)"/>
  <circle cx="-82" cy="-12" r="66" fill="#8A6A2A" opacity="0.18" filter="url(#blur8)" transform="translate(0 8)"/>
  <circle cx="82" cy="-12" r="66" fill="#8A6A2A" opacity="0.18" filter="url(#blur8)" transform="translate(0 8)"/>
  <circle cx="-82" cy="-14" r="64" fill="url(#eye)"/>
  <circle cx="82" cy="-14" r="64" fill="url(#eye)"/>
  <circle cx="-72" cy="-2" r="38" fill="#0B1F40"/>
  <circle cx="92" cy="-2" r="38" fill="#0B1F40"/>
  <circle cx="-84" cy="-16" r="13" fill="#FFFFFF"/><circle cx="80" cy="-16" r="13" fill="#FFFFFF"/>
  <circle cx="-62" cy="10" r="6" fill="#FFFFFF" opacity="0.85"/><circle cx="102" cy="10" r="6" fill="#FFFFFF" opacity="0.85"/>
  <ellipse cx="-150" cy="78" rx="38" ry="24" fill="#F29A7C" opacity="0.5" filter="url(#blur8)"/>
  <ellipse cx="150" cy="78" rx="38" ry="24" fill="#F29A7C" opacity="0.5" filter="url(#blur8)"/>
  <path d="M-46 74 Q0 124 46 74" fill="none" stroke="#0F2A55" stroke-width="16" stroke-linecap="round"/>
  ${star(250, -250, 1.05, 0.95)}${star(318, -168, 0.5, 0.8)}${star(-300, -190, 0.55, 0.75)}
</g>`;

const svg = (w, h, body, vb = `0 0 ${w} ${h}`) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}">\n${defs}\n${body}\n</svg>\n`;

const iconBody = (rx) => `<rect width="1024" height="1024" rx="${rx}" fill="url(#bg)"/>
<rect width="1024" height="1024" rx="${rx}" fill="url(#bgGlow)"/>
<g transform="translate(512 530) scale(1.18)">${mascot}</g>`;

// logo.svg: squircle-masked icon for docs and web. icon.png: full-bleed square (iOS applies its own mask).
const logo = svg(1024, 1024, iconBody(232));
const iconFull = svg(1024, 1024, iconBody(0));
// Mascot spans 640 units; the safe zone is 66 percent of 1024 (676px), so scale 1.0 fits.
const adaptive = svg(1024, 1024, `<g transform="translate(512 512) scale(1.02)">${mascot}</g>`);
const mark = svg(256, 256, `<g transform="translate(128 126) scale(0.4)">${mascot}</g>`);
const splash = svg(1284, 2778, `<rect width="1284" height="2778" fill="url(#bg2)"/>
<g transform="translate(642 1250) scale(1.15)">${mascot}</g>
<text x="642" y="1820" text-anchor="middle" font-family="Manrope, Inter, system-ui, sans-serif" font-size="120" font-weight="700" fill="#0F2A55">Abonda</text>`)
  .replace('</defs>', `<linearGradient id="bg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EAF3FC"/><stop offset="0.55" stop-color="#B9D3EE"/><stop offset="1" stop-color="#7DB8F0"/></linearGradient></defs>`);

const files = { 'logo.svg': logo, 'logo-mark.svg': mark, 'icon-full.svg': iconFull, 'adaptive.svg': adaptive, 'splash.svg': splash };
for (const [name, content] of Object.entries(files)) writeFileSync(join(here, name), content);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const shots = [
  ['icon-full.svg', 'icon.png', 1024, 1024, false],
  ['adaptive.svg', 'adaptive-icon.png', 1024, 1024, true],
  ['splash.svg', 'splash.png', 1284, 2778, false],
  ['icon-full.svg', 'favicon.png', 48, 48, false],
  ['logo-mark.svg', 'logo-mark.png', 256, 256, true],
];
for (const [src, out, w, h, transparent] of shots) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${w}px;height:${h}px}</style>${files[src]}`);
  await page.screenshot({ path: join(here, out), omitBackground: transparent });
  await page.close();
}
await browser.close();
