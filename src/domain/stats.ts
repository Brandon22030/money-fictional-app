import type { IntentionKind, Transaction } from '@/src/domain/types';

export type DailyDelta = { amountMinor: number; percent: number };
export type MonthlyTotal = { month: string; inMinor: number; outMinor: number };
export type KindShare = { kind: IntentionKind; amountMinor: number; ratio: number };

export const INTENTION_KINDS: IntentionKind[] = ['receive', 'send', 'pay', 'withdraw'];

export function signedAmount(transaction: Transaction): number {
  return transaction.kind === 'receive' ? transaction.amountMinor : -transaction.amountMinor;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function dailyDelta(transactions: Transaction[], balanceMinor: number, now: Date): DailyDelta {
  const amountMinor = transactions
    .filter((tx) => isSameDay(new Date(tx.createdAt), now))
    .reduce((sum, tx) => sum + signedAmount(tx), 0);
  const previous = balanceMinor - amountMinor;
  const percent = previous > 0 ? (amountMinor / previous) * 100 : 0;
  return { amountMinor, percent };
}

export function monthlyTotals(transactions: Transaction[], now: Date, months = 6): MonthlyTotal[] {
  const buckets: MonthlyTotal[] = [];
  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    buckets.push({ month: monthKey(date), inMinor: 0, outMinor: 0 });
  }
  for (const tx of transactions) {
    const bucket = buckets.find((item) => item.month === monthKey(new Date(tx.createdAt)));
    if (!bucket) continue;
    if (tx.kind === 'receive') {
      bucket.inMinor += tx.amountMinor;
    } else {
      bucket.outMinor += tx.amountMinor;
    }
  }
  return buckets;
}

export function shareByKind(transactions: Transaction[]): KindShare[] {
  const totals = INTENTION_KINDS.map((kind) => ({
    kind,
    amountMinor: transactions
      .filter((tx) => tx.kind === kind)
      .reduce((sum, tx) => sum + tx.amountMinor, 0),
  }));
  const sum = totals.reduce((acc, item) => acc + item.amountMinor, 0);
  return totals.map((item) => ({ ...item, ratio: sum > 0 ? item.amountMinor / sum : 0 }));
}
