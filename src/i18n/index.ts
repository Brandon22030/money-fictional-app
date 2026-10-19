import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import type { Language } from '@/src/config/locale';

import enAbundance from './locales/en/abundance.json';
import enCard from './locales/en/card.json';
import enCardScreen from './locales/en/cardScreen.json';
import enCharts from './locales/en/charts.json';
import enCommon from './locales/en/common.json';
import enContent from './locales/en/content.json';
import enHistory from './locales/en/history.json';
import enHome from './locales/en/home.json';
import enKeypad from './locales/en/keypad.json';
import enNav from './locales/en/nav.json';
import enSettings from './locales/en/settings.json';
import enTransactions from './locales/en/transactions.json';
import enTransfer from './locales/en/transfer.json';
import enVoice from './locales/en/voice.json';
import frAbundance from './locales/fr/abundance.json';
import frCard from './locales/fr/card.json';
import frCardScreen from './locales/fr/cardScreen.json';
import frCharts from './locales/fr/charts.json';
import frCommon from './locales/fr/common.json';
import frContent from './locales/fr/content.json';
import frHistory from './locales/fr/history.json';
import frHome from './locales/fr/home.json';
import frKeypad from './locales/fr/keypad.json';
import frNav from './locales/fr/nav.json';
import frSettings from './locales/fr/settings.json';
import frTransactions from './locales/fr/transactions.json';
import frTransfer from './locales/fr/transfer.json';
import frVoice from './locales/fr/voice.json';

export const NAMESPACES = [
  'common',
  'content',
  'voice',
  'card',
  'keypad',
  'nav',
  'transactions',
  'charts',
  'home',
  'cardScreen',
  'abundance',
  'transfer',
  'history',
  'settings',
] as const;

export type Namespace = (typeof NAMESPACES)[number];

export const resources = {
  fr: {
    common: frCommon,
    content: frContent,
    voice: frVoice,
    card: frCard,
    keypad: frKeypad,
    nav: frNav,
    transactions: frTransactions,
    charts: frCharts,
    home: frHome,
    cardScreen: frCardScreen,
    abundance: frAbundance,
    transfer: frTransfer,
    history: frHistory,
    settings: frSettings,
  },
  en: {
    common: enCommon,
    content: enContent,
    voice: enVoice,
    card: enCard,
    keypad: enKeypad,
    nav: enNav,
    transactions: enTransactions,
    charts: enCharts,
    home: enHome,
    cardScreen: enCardScreen,
    abundance: enAbundance,
    transfer: enTransfer,
    history: enHistory,
    settings: enSettings,
  },
};

export function getInitialLanguage(): Language {
  const code = getLocales()[0]?.languageCode;
  return code === 'fr' ? 'fr' : 'en';
}

if (!i18n.isInitialized) {
  // eslint-disable-next-line import/no-named-as-default-member
  void i18n.use(initReactI18next).init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    ns: [...NAMESPACES],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    initAsync: false,
  });
}

export default i18n;
