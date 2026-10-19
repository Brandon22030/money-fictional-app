import type { Currency, Language } from '@/src/config/locale';
import { spokenAmount } from '@/src/services/voice/spokenAmount';

const CASES: [Language, Currency, number, string][] = [
  ['fr', 'EUR', 125050, '1250 euros et 50 centimes'],
  ['fr', 'EUR', 100, '1 euro'],
  ['fr', 'EUR', 101, '1 euro et 1 centime'],
  ['fr', 'EUR', 50, '50 centimes'],
  ['fr', 'EUR', 0, '0 euro'],
  ['fr', 'EUR', 100_000_000, "1000000 d'euros"],
  ['fr', 'XOF', 1_000_000, '1000000 de francs CFA'],
  ['fr', 'XOF', 1, '1 franc CFA'],
  ['fr', 'XOF', 2500, '2500 francs CFA'],
  ['fr', 'USD', 125050, '1250 dollars et 50 cents'],
  ['en', 'USD', 125050, '1250 dollars and 50 cents'],
  ['en', 'USD', 100, '1 dollar'],
  ['en', 'USD', 0, '0 dollars'],
  ['en', 'EUR', 125050, '1250 euros and 50 cents'],
  ['en', 'XOF', 1_000_000, '1000000 CFA francs'],
  ['en', 'XOF', 1, '1 CFA franc'],
];

describe('spokenAmount', () => {
  it.each(CASES)('%s %s %d -> %s', (language, currency, minor, expected) => {
    expect(spokenAmount(minor, currency, language)).toBe(expected);
  });

  it('never contains thousands separators', () => {
    expect(spokenAmount(123_456_789, 'EUR', 'fr')).toBe('1234567 euros et 89 centimes');
  });
});
