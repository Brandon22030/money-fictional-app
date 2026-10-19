import { CURRENCIES, LOCALE_TAGS, type Currency, type Language } from '@/src/config/locale';

export type MoneyParts = {
  full: string;
  integer: string;
  decimals: string;
  suffix: string;
};

const NARROW_NBSP = ' ';
const NBSP = ' ';

const SEPARATORS: Record<Language, { group: string; decimal: string }> = {
  fr: { group: NARROW_NBSP, decimal: ',' },
  en: { group: ',', decimal: '.' },
};

function factor(currency: Currency): number {
  return 10 ** CURRENCIES[currency].decimals;
}

export function toMinor(major: number, currency: Currency): number {
  return Math.round(major * factor(currency));
}

export function fromMinor(minor: number, currency: Currency): number {
  return minor / factor(currency);
}

function groupDigits(digits: string, group: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, group);
}

/** True when the currency symbol goes before the amount ("$12"), false when it follows it. */
export function isCurrencyPrefixed(currency: Currency, language: Language): boolean {
  return language === 'en' && currency !== 'XOF';
}

export function formatMoney(minor: number, currency: Currency, language: Language): MoneyParts {
  const { decimals: digitsCount, symbol } = CURRENCIES[currency];
  const { group, decimal } = SEPARATORS[language];
  const negative = minor < 0;
  const absolute = Math.abs(Math.round(minor));
  const scale = factor(currency);
  const whole = Math.floor(absolute / scale);
  const fraction = absolute % scale;

  const sign = negative ? '-' : '';
  const groupedWhole = groupDigits(String(whole), group);
  const decimals = digitsCount > 0 ? `${decimal}${String(fraction).padStart(digitsCount, '0')}` : '';

  if (isCurrencyPrefixed(currency, language)) {
    const integer = `${sign}${symbol}${groupedWhole}`;
    return { full: `${integer}${decimals}`, integer, decimals, suffix: '' };
  }

  const integer = `${sign}${groupedWhole}`;
  return { full: `${integer}${decimals}${NBSP}${symbol}`, integer, decimals, suffix: symbol };
}

function trimFraction(value: number, language: Language): string {
  const rounded = Math.round(value * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return language === 'fr' ? text.replace('.', ',') : text;
}

export function formatCompact(minor: number, currency: Currency, language: Language): string {
  const major = Math.abs(fromMinor(minor, currency));
  const sign = minor < 0 ? '-' : '';
  const mSeparator = language === 'fr' ? ' ' : '';

  if (major >= 999_500) {
    return `${sign}${trimFraction(major / 1_000_000, language)}${mSeparator}M`;
  }
  if (major >= 1000) {
    const thousands = major / 1000;
    const text = thousands >= 100 ? String(Math.round(thousands)) : trimFraction(thousands, language);
    return `${sign}${text}k`;
  }
  return `${sign}${Math.round(major)}`;
}

export function getLocaleTag(language: Language): string {
  return LOCALE_TAGS[language];
}
