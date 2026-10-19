import { execFileSync } from 'child_process';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = join(__dirname, '..', '..');
const SKIP_DIRS = new Set(['node_modules', '.git', '.agents', '.claude', '.expo', 'ios', 'android', 'coverage']);
const TEXT_EXT = /\.(ts|tsx|js|jsx|json|md|html|css|svg|mjs)$/;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (TEXT_EXT.test(entry) && entry !== 'package-lock.json') out.push(full);
  }
  return out;
}

const FILES = walk(ROOT);
const rel = (f: string) => relative(ROOT, f);
const isTest = (f: string) => f.includes('__tests__');

describe('project policy', () => {
  it('scans a meaningful number of files', () => {
    expect(FILES.length).toBeGreaterThan(80);
  });

  it('contains no forbidden store-compliance word in code, locales, app.json, README or mockup', () => {
    const forbidden = new RegExp(['pr' + 'ank', 'fa' + 'ke', 'faux', 'canular', 'blague', 'vi' + 'sa', 'master' + 'card', 'am' + 'ex'].join('|'), 'i');
    const hits: string[] = [];
    for (const file of FILES.filter((f) => !isTest(f))) {
      const content = readFileSync(file, 'utf8');
      content.split('\n').forEach((line, i) => {
        if (forbidden.test(line)) hits.push(`${rel(file)}:${i + 1}: ${line.trim().slice(0, 80)}`);
      });
    }
    expect(hits).toEqual([]);
  });

  it('contains no em dash in any text file', () => {
    const emDash = String.fromCharCode(0x2014);
    const hits = FILES.filter((f) => readFileSync(f, 'utf8').includes(emDash)).map(rel);
    expect(hits).toEqual([]);
  });

  it('has no disabled test', () => {
    const pattern = /\b(it|test|describe)\.(skip|todo)\b|\b(xit|xdescribe|xtest)\(/;
    const hits = FILES.filter((f) => isTest(f) && f !== __filename)
      .filter((f) => pattern.test(readFileSync(f, 'utf8')))
      .map(rel);
    expect(hits).toEqual([]);
  });

  it('never imports a sharing, capture, export or print API', () => {
    const banned = /from\s+['"](expo-sharing|react-native-view-shot|expo-media-library|expo-print|expo-clipboard)['"]|require\(['"](expo-sharing|react-native-view-shot|expo-media-library|expo-print|expo-clipboard)['"]\)|\bShare\s*\.\s*share\b|import\s*\{[^}]*\bShare\b[^}]*\}\s*from\s*['"]react-native['"]|\bClipboard\b/;
    const hits = FILES.filter((f) => /\.(ts|tsx|js)$/.test(f) && !isTest(f) && /\/(app|src)\//.test(f))
      .filter((f) => banned.test(readFileSync(f, 'utf8')))
      .map(rel);
    expect(hits).toEqual([]);
  });

  it('declares none of the forbidden packages as dependency', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    const all = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    for (const name of ['expo-sharing', 'react-native-view-shot', 'expo-media-library', 'expo-print', 'expo-clipboard']) {
      expect(all).not.toContain(name);
    }
  });

  it('does not track .env or .claude files and keeps settings.json ignored', () => {
    const tracked = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n');
    expect(tracked.filter((f) => /^\.claude\/|(^|\/)\.env(\.|$)/.test(f))).toEqual([]);
    expect(readFileSync(join(ROOT, '.gitignore'), 'utf8')).toMatch(/settings\.json/);
  });

  it('app.json describes the tool as visualization and manifestation', () => {
    const cfg = JSON.parse(readFileSync(join(ROOT, 'app.json'), 'utf8')) as { expo: { name: string; description: string; userInterfaceStyle: string; orientation: string } };
    expect(cfg.expo.name).toBe('Abonda');
    expect(cfg.expo.description).toMatch(/visualization/i);
    expect(cfg.expo.description).toMatch(/manifestation/i);
    expect(cfg.expo.userInterfaceStyle).toBe('light');
    expect(cfg.expo.orientation).toBe('portrait');
  });
});
