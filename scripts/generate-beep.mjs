// Generates assets/sounds/teller-beep.wav : a short two-note "ding-dong" (about 400 ms).
import { Buffer } from 'node:buffer';
// Usage: node scripts/generate-beep.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 22050;
const NOTES = [
  { freq: 880, start: 0, duration: 0.2 },
  { freq: 659.25, start: 0.18, duration: 0.22 },
];
const TOTAL_SECONDS = 0.4;

const samples = new Int16Array(Math.round(SAMPLE_RATE * TOTAL_SECONDS));
for (const { freq, start, duration } of NOTES) {
  const offset = Math.round(start * SAMPLE_RATE);
  const length = Math.round(duration * SAMPLE_RATE);
  for (let i = 0; i < length && offset + i < samples.length; i += 1) {
    const t = i / SAMPLE_RATE;
    const attack = Math.min(1, i / (SAMPLE_RATE * 0.005));
    const decay = Math.exp(-t * 9);
    const tone = Math.sin(2 * Math.PI * freq * t) + 0.25 * Math.sin(4 * Math.PI * freq * t);
    const value = tone * attack * decay * 0.45 * 32767;
    samples[offset + i] = Math.max(-32768, Math.min(32767, samples[offset + i] + value));
  }
}

const data = Buffer.from(samples.buffer);
const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + data.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(SAMPLE_RATE, 24);
header.writeUInt32LE(SAMPLE_RATE * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(data.length, 40);

const target = resolve(dirname(fileURLToPath(import.meta.url)), '../assets/sounds/teller-beep.wav');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, Buffer.concat([header, data]));
