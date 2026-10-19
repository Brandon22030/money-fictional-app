import { readFileSync } from 'fs';
import { join } from 'path';

const SKY_BG = join(__dirname, '..', '..', 'assets', 'visual', 'sky-bg.png');

// Width and height from the PNG IHDR chunk (bytes 16-23).
function pngSize(buffer: Buffer): { width: number; height: number } {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

describe('sky background asset', () => {
  const png = readFileSync(SKY_BG);

  it('keeps the 3x mockup resolution (390 x 844 pt)', () => {
    expect(png.subarray(1, 4).toString('ascii')).toBe('PNG');
    expect(pngSize(png)).toEqual({ width: 1170, height: 2532 });
  });

  it('stays light (256-colour palette, no visible loss on this smooth gradient)', () => {
    expect(png.length).toBeLessThan(120 * 1024);
  });
});
