// Synthesizes the original ATM-style beep (1500 Hz, 300 ms, soft square wave) and encodes it to
// assets/sounds/atm-beep.m4a. Needs macOS (afconvert). Run: node scripts/generate-atm-beep.mjs
import { Buffer } from 'node:buffer';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 44100;
const FREQ = 1500;
const DURATION_MS = 300;
const FADE_MS = 10;
const PEAK = 10 ** (-3 / 20);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Fundamental + odd harmonics (soft square), one-pole low-pass, raised-cosine fades.
function synthesize() {
  const n = Math.round((SR * DURATION_MS) / 1000);
  const fade = Math.round((SR * FADE_MS) / 1000);
  const out = new Float32Array(n);
  const a = 1 - Math.exp((-2 * Math.PI * 6000) / SR);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * FREQ * i) / SR;
    const s = Math.sin(t) + Math.sin(3 * t) / 3 + Math.sin(5 * t) / 5 + Math.sin(7 * t) / 7;
    lp += a * (s - lp);
    let env = 1;
    if (i < fade) env = 0.5 - 0.5 * Math.cos((Math.PI * i) / fade);
    else if (i >= n - fade) env = 0.5 - 0.5 * Math.cos((Math.PI * (n - 1 - i)) / fade);
    out[i] = lp * env;
  }
  const gain = PEAK / out.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  return out.map((v) => v * gain);
}

// 44.1 kHz mono 16 bit PCM WAV.
function wavBuffer(samples) {
  const n = samples.length;
  const b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0);
  b.writeUInt32LE(36 + n * 2, 4);
  b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36);
  b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767))), 44 + i * 2);
  }
  return b;
}

const tmp = mkdtempSync(join(tmpdir(), 'atm-beep-'));
try {
  const wav = join(tmp, 'atm-beep.wav');
  writeFileSync(wav, wavBuffer(synthesize()));
  execFileSync('afconvert', [
    '-f', 'm4af', '-d', 'aac', '-b', '96000', wav, join(root, 'assets/sounds/atm-beep.m4a'),
  ]);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
