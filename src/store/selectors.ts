import { useMemo } from 'react';

import { getDemoTransactions } from '@/src/data/intentions';
import { formatMoney, type MoneyParts } from '@/src/domain/money';
import type { Transaction } from '@/src/domain/types';

import { useAppStore } from './useAppStore';

export function useAllTransactions(): Transaction[] {
  const userTransactions = useAppStore((state) => state.userTransactions);
  const currency = useAppStore((state) => state.currency);
  return useMemo(
    () =>
      [...getDemoTransactions(currency), ...userTransactions].sort(
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
