import { useMemo } from 'react';

import { getDemoTransactions } from '@/src/data/intentions';
import { formatMoney, type MoneyParts } from '@/src/domain/money';
import type { Transaction } from '@/src/domain/types';
import { getVisualFixture } from '@/src/dev/visualFixture';

import { useAppStore } from './useAppStore';

export function useAllTransactions(): Transaction[] {
  const userTransactions = useAppStore((state) => state.userTransactions);
  const currency = useAppStore((state) => state.currency);
  return useMemo(
    () =>
      [...(getVisualFixture()?.transactions ?? getDemoTransactions(currency)), ...userTransactions].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [userTransactions, currency],
  );
}

export function useBalanceParts(): MoneyParts {
  const balanceMinor = useAppStore((state) => state.balanceMinor);
  const currency = useAppStore((state) => state.currency);
  const language = useAppStore((state) => state.language);
  return useMemo(() => formatMoney(balanceMinor, currency, language), [balanceMinor, currency, language]);
}

/**
 * True when at least one intention is more recent than the last visit of the History
 * screen (or History was never opened and there is any intention). Drives the bell badge.
 */
export function useHasUnseenIntentions(): boolean {
  const transactions = useAllTransactions();
  const lastHistoryVisitAt = useAppStore((state) => state.lastHistoryVisitAt);
  return useMemo(() => {
    if (lastHistoryVisitAt === null) return transactions.length > 0;
    const lastVisit = new Date(lastHistoryVisitAt).getTime();
    return transactions.some((tx) => new Date(tx.createdAt).getTime() > lastVisit);
  }, [transactions, lastHistoryVisitAt]);
}
