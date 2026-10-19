import { getLocales } from 'expo-localization';

import type { Currency } from '@/src/config/locale';

import { toMinor } from './money';

const XOF_REGIONS = ['BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG'];

export const INITIAL_BALANCE_MAJOR = 1_000_000;

export function defaultCurrencyForRegion(region: string | null | undefined): Currency {
  const code = region?.toUpperCase();
  if (code && XOF_REGIONS.includes(code)) return 'XOF';
  if (code === 'US') return 'USD';
  return 'EUR';
}

export function getDefaultCurrency(): Currency {
  return defaultCurrencyForRegion(getLocales()[0]?.regionCode);
}

export function initialBalanceMinor(currency: Currency): number {
  return toMinor(INITIAL_BALANCE_MAJOR, currency);
}
