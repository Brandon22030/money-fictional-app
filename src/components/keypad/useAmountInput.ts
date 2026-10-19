import { useCallback, useState } from 'react';

import { CURRENCIES, MAX_BALANCE_MINOR, type Currency } from '@/src/config/locale';

export type AmountKey =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'decimal'
  | 'backspace';

export type UseAmountInputOptions = {
  currency: Currency;
  initialMinor?: number;
  decimalSeparator?: string;
};

export type UseAmountInputResult = {
  display: string;
  minor: number;
  press: (key: AmountKey) => void;
  clear: () => void;
  canAddDecimal: boolean;
};

function rawFromMinor(minor: number, decimals: number): string {
  if (!Number.isFinite(minor) || minor <= 0) return '';
  const safe = Math.min(Math.floor(minor), MAX_BALANCE_MINOR);
  if (decimals === 0) return String(safe);
  const factor = 10 ** decimals;
  const integer = Math.floor(safe / factor);
  const fraction = String(safe % factor)
    .padStart(decimals, '0')
    .replace(/0+$/, '');
  return fraction ? `${integer}.${fraction}` : String(integer);
}

function minorFromRaw(raw: string, decimals: number): number {
  if (raw === '') return 0;
  const [integer = '', fraction = ''] = raw.split('.');
  const padded = fraction.padEnd(decimals, '0');
  return Number(`${integer || '0'}${padded}`);
}

function applyKey(raw: string, key: AmountKey, decimals: number): string {
  if (key === 'backspace') return raw.slice(0, -1);
  if (key === 'decimal') {
    if (decimals === 0 || raw.includes('.')) return raw;
    return raw === '' ? '0.' : `${raw}.`;
  }
  const dotIndex = raw.indexOf('.');
  if (dotIndex !== -1 && raw.length - dotIndex - 1 >= decimals) return raw;
  const next = raw === '0' || raw === '' ? key : `${raw}${key}`;
  if (minorFromRaw(next, decimals) > MAX_BALANCE_MINOR) return raw;
  return next;
}

export function useAmountInput({
  currency,
  initialMinor = 0,
  decimalSeparator = '.',
}: UseAmountInputOptions): UseAmountInputResult {
  const { decimals } = CURRENCIES[currency];
  const [raw, setRaw] = useState(() => rawFromMinor(initialMinor, decimals));

  const press = useCallback(
    (key: AmountKey) => setRaw((current) => applyKey(current, key, decimals)),
    [decimals],
  );
  const clear = useCallback(() => setRaw(''), []);

  return {
    display: (raw === '' ? '0' : raw).replace('.', decimalSeparator),
    minor: minorFromRaw(raw, decimals),
    press,
    clear,
    canAddDecimal: decimals > 0 && !raw.includes('.'),
  };
}
