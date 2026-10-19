import { act, renderHook } from '@testing-library/react-native';

import { MAX_BALANCE_MINOR, type Currency } from '@/src/config/locale';

import { useAmountInput, type AmountKey } from '../useAmountInput';

async function typeKeys(
  currency: Currency,
  keys: AmountKey[],
  options: { initialMinor?: number; decimalSeparator?: string } = {},
) {
  const hook = await renderHook(() => useAmountInput({ currency, ...options }));
  for (const key of keys) {
    await act(async () => hook.result.current.press(key));
  }
  return hook.result;
}

const keys = (value: string): AmountKey[] =>
  value.split('').map((c) => (c === '.' ? 'decimal' : (c as AmountKey)));

describe('useAmountInput', () => {
  it('starts at zero', async () => {
    const result = await typeKeys('EUR', []);
    expect(result.current.display).toBe('0');
    expect(result.current.minor).toBe(0);
  });

  it('builds EUR amounts in minor units', async () => {
    const result = await typeKeys('EUR', keys('12.5'));
    expect(result.current.display).toBe('12.5');
    expect(result.current.minor).toBe(1250);
  });

  it('strips leading zeros', async () => {
    const result = await typeKeys('EUR', keys('007'));
    expect(result.current.display).toBe('7');
    expect(result.current.minor).toBe(700);
  });

  it('keeps a single zero', async () => {
    const result = await typeKeys('EUR', keys('000'));
    expect(result.current.display).toBe('0');
  });

  it('starts with 0. when decimal is pressed first', async () => {
    const result = await typeKeys('USD', keys('.5'));
    expect(result.current.display).toBe('0.5');
    expect(result.current.minor).toBe(50);
  });

  it('limits EUR and USD to 2 decimals', async () => {
    const result = await typeKeys('EUR', keys('1.234'));
    expect(result.current.display).toBe('1.23');
    expect(result.current.minor).toBe(123);
  });

  it('ignores a second decimal separator', async () => {
    const result = await typeKeys('EUR', keys('1.2.3'));
    expect(result.current.display).toBe('1.23');
  });

  it('disables decimals for XOF', async () => {
    const result = await typeKeys('XOF', keys('1.500'));
    expect(result.current.display).toBe('1500');
    expect(result.current.minor).toBe(1500);
    expect(result.current.canAddDecimal).toBe(false);
  });

  it('reports canAddDecimal for EUR until a decimal is typed', async () => {
    const before = await typeKeys('EUR', keys('1'));
    expect(before.current.canAddDecimal).toBe(true);
    const after = await typeKeys('EUR', keys('1.'));
    expect(after.current.canAddDecimal).toBe(false);
  });

  it('backspace removes the last character and is safe when empty', async () => {
    const result = await typeKeys('EUR', ['1', '2', 'backspace', 'backspace', 'backspace']);
    expect(result.current.display).toBe('0');
    expect(result.current.minor).toBe(0);
  });

  it('backspace over the decimal separator re-enables it', async () => {
    const result = await typeKeys('EUR', [...keys('1.'), 'backspace']);
    expect(result.current.display).toBe('1');
    expect(result.current.canAddDecimal).toBe(true);
  });

  it('ignores input beyond MAX_BALANCE_MINOR', async () => {
    const maxEuros = String(MAX_BALANCE_MINOR / 100);
    const result = await typeKeys('EUR', [...keys(maxEuros), '1']);
    expect(result.current.minor).toBe(MAX_BALANCE_MINOR);
    expect(result.current.display).toBe(maxEuros);
  });

  it('caps XOF at MAX_BALANCE_MINOR', async () => {
    const max = String(MAX_BALANCE_MINOR);
    const result = await typeKeys('XOF', [...keys(max), '9']);
    expect(result.current.minor).toBe(MAX_BALANCE_MINOR);
  });

  it('uses the provided decimal separator in display only', async () => {
    const result = await typeKeys('EUR', keys('3.5'), { decimalSeparator: ',' });
    expect(result.current.display).toBe('3,5');
    expect(result.current.minor).toBe(350);
  });

  it('prefills from initialMinor', async () => {
    const eur = await typeKeys('EUR', [], { initialMinor: 18642050 });
    expect(eur.current.display).toBe('186420.5');
    expect(eur.current.minor).toBe(18642050);
    const xof = await typeKeys('XOF', [], { initialMinor: 5000 });
    expect(xof.current.display).toBe('5000');
  });

  it('clear resets to zero', async () => {
    const hook = await renderHook(() => useAmountInput({ currency: 'EUR', initialMinor: 500 }));
    await act(async () => hook.result.current.clear());
    expect(hook.result.current.minor).toBe(0);
    expect(hook.result.current.display).toBe('0');
  });
});
