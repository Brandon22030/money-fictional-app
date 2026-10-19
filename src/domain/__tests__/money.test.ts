import { formatCompact, formatMoney, fromMinor, toMinor } from '@/src/domain/money';

describe('formatMoney', () => {
  it('formats EUR in French', () => {
    const parts = formatMoney(123456, 'EUR', 'fr');
    expect(parts.full).toBe('1 234,56 €');
    expect(parts.integer).toBe('1 234');
    expect(parts.decimals).toBe(',56');
    expect(parts.suffix).toBe('€');
  });

  it('formats USD in English', () => {
    const parts = formatMoney(123456, 'USD', 'en');
    expect(parts.full).toBe('$1,234.56');
    expect(parts.integer).toBe('$1,234');
    expect(parts.decimals).toBe('.56');
  });

  it('formats XOF without decimals', () => {
    const fr = formatMoney(1234567, 'XOF', 'fr');
    expect(fr.full).toBe('1 234 567 FCFA');
    expect(fr.decimals).toBe('');
    expect(formatMoney(1234567, 'XOF', 'en').decimals).toBe('');
  });

  it('pads the fraction and handles zero', () => {
    expect(formatMoney(5, 'EUR', 'en').full).toBe('€0.05');
    expect(formatMoney(0, 'XOF', 'fr').integer).toBe('0');
  });
});

describe('formatCompact', () => {
  it('abbreviates thousands', () => {
    expect(formatCompact(186486, 'XOF', 'en')).toBe('186k');
    expect(formatCompact(12500, 'XOF', 'fr')).toBe('12,5k');
  });

  it('abbreviates millions per language', () => {
    expect(formatCompact(1_250_000, 'XOF', 'en')).toBe('1.3M');
    expect(formatCompact(1_250_000, 'XOF', 'fr')).toBe('1,3 M');
  });

  it('uses major units for 2-decimal currencies', () => {
    expect(formatCompact(18648600, 'EUR', 'en')).toBe('186k');
  });

  it('keeps small values and rolls over near a million', () => {
    expect(formatCompact(950, 'XOF', 'en')).toBe('950');
    expect(formatCompact(999_700, 'XOF', 'en')).toBe('1M');
  });
});

describe('toMinor / fromMinor', () => {
  it('converts according to currency precision', () => {
    expect(toMinor(12.34, 'EUR')).toBe(1234);
    expect(toMinor(1000, 'XOF')).toBe(1000);
    expect(fromMinor(1234, 'USD')).toBe(12.34);
    expect(fromMinor(1000, 'XOF')).toBe(1000);
  });
});
