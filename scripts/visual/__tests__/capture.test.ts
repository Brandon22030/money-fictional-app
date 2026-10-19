import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const script = join(__dirname, '..', 'capture.mjs');

describe('capture.mjs arguments', () => {
  it('rejects an empty --holder= before doing any work', () => {
    const result = spawnSync(process.execPath, [script, '--worst', '--holder='], {
      encoding: 'utf8',
      timeout: 10_000,
      env: { ...process.env, PLAYWRIGHT_PATH: '' },
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Empty --holder=');
  });
});
