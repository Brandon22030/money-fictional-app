export type Currency = 'EUR' | 'XOF' | 'USD';
export type Language = 'fr' | 'en';

export const CURRENCIES: Record<Currency, { decimals: number; symbol: string }> = {
  EUR: { decimals: 2, symbol: '€' },
  USD: { decimals: 2, symbol: '$' },
  XOF: { decimals: 0, symbol: 'FCFA' },
};

export const LOCALE_TAGS: Record<Language, string> = {
  fr: 'fr-FR',
  en: 'en-US',
};

export const SPEECH_TAGS: Record<Language, string> = {
  fr: 'fr-FR',
  en: 'en-US',
};

export const MAX_BALANCE_MINOR = 99_999_999_999_99;
