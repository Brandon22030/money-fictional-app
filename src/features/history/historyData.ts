import type { Transaction } from '@/src/domain/types';

export type TransactionEntry = {
  transaction: Transaction;
  title: string;
  amountLabel: string;
};

export type DaySection<T> = { key: string; date: Date; data: T[] };

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\s  ]/g, '')
    .toLowerCase();
}

/** Keeps entries whose translated title or formatted amount contains the query. */
export function filterEntries(entries: TransactionEntry[], query: string): TransactionEntry[] {
  const needle = normalize(query);
  if (needle === '') return entries;
  return entries.filter(
    (entry) => normalize(entry.title).includes(needle) || normalize(entry.amountLabel).includes(needle),
  );
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/** Groups entries (already sorted, newest first) by calendar day. */
export function groupByDay(entries: TransactionEntry[]): DaySection<TransactionEntry>[] {
  const sections: DaySection<TransactionEntry>[] = [];
  for (const entry of entries) {
    const date = new Date(entry.transaction.createdAt);
    const key = dayKey(date);
    const last = sections[sections.length - 1];
    if (last && last.key === key) {
      last.data.push(entry);
    } else {
      sections.push({ key, date, data: [entry] });
    }
  }
  return sections;
}
