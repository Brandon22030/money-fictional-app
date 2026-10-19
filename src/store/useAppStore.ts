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

/** Only the most recent user intentions are kept, to bound the persisted payload. */
export const MAX_USER_TRANSACTIONS = 500;

// Version 1 data without lastHistoryVisitAt or repeatAnnouncement (added later) is still valid:
// merge fills them with their defaults, so adding those optional fields did not need a version bump.
export const STORE_VERSION = 1;

type AppData = {
  balanceMinor: number;
  currency: Currency;
  language: Language;
  holderName: string;
  card: Card;
  userTransactions: Transaction[];
  /** ISO date of the last time the History screen was opened, null if never. */
  lastHistoryVisitAt: string | null;
  /** When true, "Listen" repeats the balance announcement until it is stopped. */
  repeatAnnouncement: boolean;
};

type AppState = AppData & {
  hasHydrated: boolean;
  setBalance: (minor: number) => void;
  applyIntention: (kind: IntentionKind, minor: number, opts?: IntentionOptions) => IntentionResult;
  setCurrency: (currency: Currency) => void;
  setLanguage: (language: Language) => void;
  setHolderName: (name: string) => void;
  regenerateCard: () => void;
  markHistoryVisited: (at?: Date) => void;
  setRepeatAnnouncement: (repeat: boolean) => void;
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
    lastHistoryVisitAt: null,
    repeatAnnouncement: false,
  };
}

function rescale(minor: number, from: Currency, to: Currency): number {
  if (CURRENCIES[from].decimals === CURRENCIES[to].decimals) return minor;
  return toMinor(fromMinor(minor, from), to);
}

const INTENTION_KINDS: readonly IntentionKind[] = ['receive', 'send', 'pay', 'withdraw'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCurrency(value: unknown): value is Currency {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(CURRENCIES, value);
}

function isLanguage(value: unknown): value is Language {
  return value === 'fr' || value === 'en';
}

function isCard(value: unknown): value is Card {
  return (
    isRecord(value) &&
    typeof value.number === 'string' &&
    /^\d{16}$/.test(value.number) &&
    typeof value.expiry === 'string' &&
    /^(0[1-9]|1[0-2])\/\d{2}$/.test(value.expiry) &&
    typeof value.cvv === 'string' &&
    /^\d{3}$/.test(value.cvv)
  );
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
}

function isTransaction(value: unknown): value is Transaction {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    INTENTION_KINDS.includes(value.kind as IntentionKind) &&
    typeof value.labelKey === 'string' &&
    typeof value.amountMinor === 'number' &&
    Number.isInteger(value.amountMinor) &&
    value.amountMinor > 0 &&
    isIsoDate(value.createdAt) &&
    (value.labelParams === undefined || isRecord(value.labelParams))
  );
}

/**
 * Validates persisted data field by field and falls back to the in-memory defaults for
 * anything missing or corrupted. Amounts depend on the currency precision, so an unknown
 * currency also discards the balance and the user intentions.
 */
export function mergePersisted<T extends AppData>(persisted: unknown, current: T): T {
  if (!isRecord(persisted)) return current;

  const currencyValid = isCurrency(persisted.currency);
  const language = isLanguage(persisted.language) ? persisted.language : current.language;
  const balanceMinor =
    currencyValid && typeof persisted.balanceMinor === 'number' && Number.isFinite(persisted.balanceMinor)
      ? clampBalance(persisted.balanceMinor)
      : current.balanceMinor;
  const userTransactions =
    currencyValid && Array.isArray(persisted.userTransactions)
      ? persisted.userTransactions.filter(isTransaction).slice(0, MAX_USER_TRANSACTIONS)
      : current.userTransactions;
  const holderName =
    typeof persisted.holderName === 'string' && persisted.holderName.trim() !== ''
      ? persisted.holderName.slice(0, HOLDER_NAME_MAX_LENGTH)
      : defaultHolderName(language);

  return {
    ...current,
    currency: currencyValid ? (persisted.currency as Currency) : current.currency,
    language,
    balanceMinor,
    holderName,
    card: isCard(persisted.card) ? persisted.card : current.card,
    userTransactions,
    lastHistoryVisitAt: isIsoDate(persisted.lastHistoryVisitAt)
      ? persisted.lastHistoryVisitAt
      : current.lastHistoryVisitAt,
    repeatAnnouncement:
      typeof persisted.repeatAnnouncement === 'boolean'
        ? persisted.repeatAnnouncement
        : current.repeatAnnouncement,
  };
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
        set({
          balanceMinor: nextBalance,
          userTransactions: [transaction, ...userTransactions].slice(0, MAX_USER_TRANSACTIONS),
        });
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

      setLanguage: (language) => {
        const { language: previous, holderName } = get();
        if (previous === language) return;
        // A holder name left at the default follows the language; a custom one is kept.
        const followsDefault = holderName === defaultHolderName(previous);
        set({ language, ...(followsDefault ? { holderName: defaultHolderName(language) } : {}) });
      },

      setHolderName: (name) => {
        const cleaned = name.trim().toUpperCase().slice(0, HOLDER_NAME_MAX_LENGTH).trim();
        set({ holderName: cleaned || defaultHolderName(get().language) });
      },

      regenerateCard: () => set({ card: newCard() }),

      markHistoryVisited: (at = new Date()) => set({ lastHistoryVisitAt: at.toISOString() }),

      setRepeatAnnouncement: (repeat) => set({ repeatAnnouncement: repeat }),

      resetAll: () => set(createInitialData()),
    }),
    {
      name: 'abonda-store-v1',
      version: STORE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      // Version 0 data has the same shape; validation happens in merge.
      migrate: (persisted) => persisted as AppData,
      merge: (persisted, current) => mergePersisted(persisted, current),
      partialize: (state): AppData => ({
        balanceMinor: state.balanceMinor,
        currency: state.currency,
        language: state.language,
        holderName: state.holderName,
        card: state.card,
        userTransactions: state.userTransactions,
        lastHistoryVisitAt: state.lastHistoryVisitAt,
        repeatAnnouncement: state.repeatAnnouncement,
      }),
      onRehydrateStorage: () => () => {
        useAppStore.setState({ hasHydrated: true });
      },
    },
  ),
);
