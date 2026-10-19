import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { CURRENCIES, MAX_BALANCE_MINOR, type Currency, type Language } from '@/src/config/locale';
import { generateCardNumber, generateCvv, generateExpiry } from '@/src/domain/card';
import { getDefaultCurrency, initialBalanceMinor } from '@/src/domain/defaults';
import { fromMinor, toMinor } from '@/src/domain/money';
import type { IntentionKind, Transaction } from '@/src/domain/types';
import i18n, { getInitialLanguage } from '@/src/i18n';

export type { IntentionKind, Transaction } from '@/src/domain/types';

export type Card = { number: string; expiry: string; cvv: string };

export type IntentionResult = { ok: true } | { ok: false; reason: 'insufficient' | 'invalid' };

export type IntentionOptions = { labelKey?: string; labelParams?: Record<string, string> };

export const HOLDER_NAME_MAX_LENGTH = 26;

type AppData = {
  balanceMinor: number;
  currency: Currency;
  language: Language;
  holderName: string;
  card: Card;
  userTransactions: Transaction[];
};

type AppState = AppData & {
  hasHydrated: boolean;
  setBalance: (minor: number) => void;
  applyIntention: (kind: IntentionKind, minor: number, opts?: IntentionOptions) => IntentionResult;
  setCurrency: (currency: Currency) => void;
  setLanguage: (language: Language) => void;
  setHolderName: (name: string) => void;
  regenerateCard: () => void;
  resetAll: () => void;
};

function defaultHolderName(language: Language): string {
  return i18n.t('content:defaultHolder', { lng: language });
}

function newCard(): Card {
  return { number: generateCardNumber(), expiry: generateExpiry(), cvv: generateCvv() };
}

function clampBalance(minor: number): number {
  return Math.min(MAX_BALANCE_MINOR, Math.max(0, Math.round(minor)));
}

function createInitialData(): AppData {
  const currency = getDefaultCurrency();
  const language = getInitialLanguage();
  return {
    balanceMinor: initialBalanceMinor(currency),
    currency,
    language,
    holderName: defaultHolderName(language),
    card: newCard(),
    userTransactions: [],
  };
}

function rescale(minor: number, from: Currency, to: Currency): number {
  if (CURRENCIES[from].decimals === CURRENCIES[to].decimals) return minor;
  return toMinor(fromMinor(minor, from), to);
}

let transactionCounter = 0;

function nextTransactionId(): string {
  transactionCounter += 1;
  return `tx-${Date.now()}-${transactionCounter}`;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...createInitialData(),
      hasHydrated: false,

      setBalance: (minor) => {
        if (!Number.isFinite(minor)) return;
        set({ balanceMinor: clampBalance(minor) });
      },

      applyIntention: (kind, minor, opts) => {
        if (!Number.isFinite(minor)) return { ok: false, reason: 'invalid' };
        const amountMinor = Math.round(minor);
        if (amountMinor <= 0) return { ok: false, reason: 'invalid' };

        const { balanceMinor, userTransactions } = get();
        const nextBalance = kind === 'receive' ? balanceMinor + amountMinor : balanceMinor - amountMinor;
        if (nextBalance < 0) return { ok: false, reason: 'insufficient' };
        if (nextBalance > MAX_BALANCE_MINOR) return { ok: false, reason: 'invalid' };

        const transaction: Transaction = {
          id: nextTransactionId(),
          kind,
          labelKey: opts?.labelKey ?? `content:intentions.${kind}`,
          ...(opts?.labelParams ? { labelParams: opts.labelParams } : {}),
          amountMinor,
          createdAt: new Date().toISOString(),
        };
        set({ balanceMinor: nextBalance, userTransactions: [transaction, ...userTransactions] });
        return { ok: true };
      },

      setCurrency: (currency) => {
        const { currency: previous, balanceMinor, userTransactions } = get();
        if (previous === currency) return;
        set({
          currency,
          balanceMinor: clampBalance(rescale(balanceMinor, previous, currency)),
          userTransactions: userTransactions.map((tx) => ({
            ...tx,
            amountMinor: rescale(tx.amountMinor, previous, currency),
          })),
        });
      },

      setLanguage: (language) => set({ language }),

      setHolderName: (name) => {
        const cleaned = name.trim().toUpperCase().slice(0, HOLDER_NAME_MAX_LENGTH).trim();
        set({ holderName: cleaned || defaultHolderName(get().language) });
      },

      regenerateCard: () => set({ card: newCard() }),

      resetAll: () => set(createInitialData()),
    }),
    {
      name: 'abonda-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): AppData => ({
        balanceMinor: state.balanceMinor,
        currency: state.currency,
        language: state.language,
        holderName: state.holderName,
        card: state.card,
        userTransactions: state.userTransactions,
      }),
      onRehydrateStorage: () => () => {
        useAppStore.setState({ hasHydrated: true });
      },
    },
  ),
);
