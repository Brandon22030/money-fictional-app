import type { Currency, Language } from '@/src/config/locale';
import { CURRENCIES } from '@/src/config/locale';

type Unit = { one: string; many: string; of: string };

type Names = { major: Unit; minor?: Unit; and: string };

const NAMES: Record<Language, Record<Currency, Names>> = {
  fr: {
    EUR: {
      major: { one: 'euro', many: 'euros', of: "d'euros" },
      minor: { one: 'centime', many: 'centimes', of: 'de centimes' },
      and: 'et',
    },
    USD: {
      major: { one: 'dollar', many: 'dollars', of: 'de dollars' },
      minor: { one: 'cent', many: 'cents', of: 'de cents' },
      and: 'et',
    },
    XOF: {
      major: { one: 'franc CFA', many: 'francs CFA', of: 'de francs CFA' },
      and: 'et',
    },
  },
  en: {
    EUR: {
      major: { one: 'euro', many: 'euros', of: 'euros' },
      minor: { one: 'cent', many: 'cents', of: 'cents' },
      and: 'and',
    },
    USD: {
      major: { one: 'dollar', many: 'dollars', of: 'dollars' },
      minor: { one: 'cent', many: 'cents', of: 'cents' },
      and: 'and',
    },
    XOF: {
      major: { one: 'CFA franc', many: 'CFA francs', of: 'CFA francs' },
      and: 'and',
    },
  },
};

function pick(unit: Unit, value: number, language: Language, round: boolean): string {
  if (language === 'fr' && round && value >= 1_000_000) return unit.of;
  const singular = language === 'fr' ? value < 2 : value === 1;
  return singular ? unit.one : unit.many;
}

/**
 * Spoken form of an amount, without thousands separators so the TTS reads a whole number.
 * Example: fr EUR 125050 -> "1250 euros et 50 centimes".
 */
export function spokenAmount(amountMinor: number, currency: Currency, language: Language): string {
  const names = NAMES[language][currency];
  const factor = 10 ** CURRENCIES[currency].decimals;
  const absolute = Math.abs(Math.round(amountMinor));
  const major = Math.floor(absolute / factor);
  const minor = absolute % factor;

  const parts: string[] = [];
  if (major > 0 || minor === 0 || !names.minor) {
    const isRound = major % 1_000_000 === 0;
    parts.push(`${major} ${pick(names.major, major, language, isRound)}`);
  }
  if (minor > 0 && names.minor) {
    parts.push(`${minor} ${pick(names.minor, minor, language, false)}`);
  }
  return parts.join(` ${names.and} `);
}
