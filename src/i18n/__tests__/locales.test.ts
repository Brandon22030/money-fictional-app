import { readFileSync } from 'fs';
import { join } from 'path';

import { NAMESPACES, resources } from '@/src/i18n';

const FORBIDDEN = ['prank', 'fake', 'canular', 'blague', 'faux', 'visa', 'mastercard', 'amex'];

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object') return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (value === null || typeof value !== 'object') return [];
  return Object.values(value as Record<string, unknown>).flatMap(collectStrings);
}

describe('locales', () => {
  it.each(NAMESPACES)('fr and en share the same keys in namespace %s', (ns) => {
    const fr = flattenKeys(resources.fr[ns]).sort();
    const en = flattenKeys(resources.en[ns]).sort();
    expect(fr).toEqual(en);
  });

  it('registers every namespace for both languages', () => {
    expect(Object.keys(resources.fr).sort()).toEqual([...NAMESPACES].sort());
    expect(Object.keys(resources.en).sort()).toEqual([...NAMESPACES].sort());
  });

  it('contains no forbidden word in any locale', () => {
    const texts = [...collectStrings(resources.fr), ...collectStrings(resources.en)];
    const offenders = texts.filter((text) =>
      FORBIDDEN.some((word) => text.toLowerCase().includes(word)),
    );
    expect(offenders).toEqual([]);
  });

  it('contains no forbidden word in app.json', () => {
    const appJson = readFileSync(join(__dirname, '..', '..', '..', 'app.json'), 'utf8').toLowerCase();
    const offenders = FORBIDDEN.filter((word) => appJson.includes(word));
    expect(offenders).toEqual([]);
  });
});

describe('navigation labels', () => {
  it('lives only in the nav namespace', () => {
    for (const lang of ['fr', 'en'] as const) {
      expect(resources[lang].common).not.toHaveProperty('tabs');
      expect(resources[lang].common).not.toHaveProperty('placeholder');
      expect(Object.keys(resources[lang].nav.tabs).sort()).toEqual(
        ['abundance', 'card', 'history', 'home', 'settings'],
      );
    }
  });

  it('is read from nav by the tabs layout', () => {
    const layout = readFileSync(join(__dirname, '..', '..', '..', 'app', '(tabs)', '_layout.tsx'), 'utf8');
    expect(layout).toContain("useTranslation('nav')");
  });
});

describe('french register', () => {
  it('addresses the user with "vous" everywhere', () => {
    const informal = /(^|[^\p{L}])(tu|te|toi|ton|ta|tes)(?=[^\p{L}]|$)|(^|[^\p{L}])t'|(^|\.\s)(choisis|accueille|offre|règle|prends|essaie)(?=[^\p{L}])/iu;
    const texts = collectStrings(resources.fr).filter((text) => informal.test(text));
    expect(texts).toEqual([]);
  });
});
