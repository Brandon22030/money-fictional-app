import { defaultCurrencyForRegion, initialBalanceMinor } from '@/src/domain/defaults';

describe('defaults', () => {
  it.each(['BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG'])('maps %s to XOF', (region) => {
    expect(defaultCurrencyForRegion(region)).toBe('XOF');
  });

  it('maps US to USD and others to EUR', () => {
    expect(defaultCurrencyForRegion('US')).toBe('USD');
    expect(defaultCurrencyForRegion('FR')).toBe('EUR');
    expect(defaultCurrencyForRegion(null)).toBe('EUR');
    expect(defaultCurrencyForRegion(undefined)).toBe('EUR');
  });

  it('starts with 1 000 000 major units', () => {
    expect(initialBalanceMinor('XOF')).toBe(1_000_000);
    expect(initialBalanceMinor('EUR')).toBe(100_000_000);
  });
});
