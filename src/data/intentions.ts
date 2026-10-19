import type { Currency } from '@/src/config/locale';
import { toMinor } from '@/src/domain/money';
import type { IntentionKind, Transaction } from '@/src/domain/types';

type DemoIntention = {
  key: string;
  kind: IntentionKind;
  amountMajor: number;
  monthsAgo: number;
  day: number;
};

const DEMO_INTENTIONS: DemoIntention[] = [
  { key: 'salary', kind: 'receive', amountMajor: 180_000, monthsAgo: 5, day: 3 },
  { key: 'rent', kind: 'pay', amountMajor: 45_000, monthsAgo: 5, day: 8 },
  { key: 'family', kind: 'receive', amountMajor: 60_000, monthsAgo: 4, day: 14 },
  { key: 'market', kind: 'pay', amountMajor: 12_500, monthsAgo: 4, day: 20 },
  { key: 'bonus', kind: 'receive', amountMajor: 95_000, monthsAgo: 3, day: 5 },
  { key: 'atm', kind: 'withdraw', amountMajor: 30_000, monthsAgo: 3, day: 18 },
  { key: 'friend', kind: 'send', amountMajor: 20_000, monthsAgo: 2, day: 11 },
  { key: 'coffee', kind: 'pay', amountMajor: 2_500, monthsAgo: 2, day: 23 },
  { key: 'salary', kind: 'receive', amountMajor: 210_000, monthsAgo: 1, day: 3 },
  { key: 'book', kind: 'pay', amountMajor: 8_000, monthsAgo: 1, day: 15 },
  { key: 'music', kind: 'send', amountMajor: 15_000, monthsAgo: 0, day: 2 },
  { key: 'fruit', kind: 'pay', amountMajor: 6_000, monthsAgo: 0, day: 4 },
];

export function getDemoTransactions(currency: Currency, now: Date = new Date()): Transaction[] {
  return DEMO_INTENTIONS.map((item, index) => {
    const planned = new Date(now.getFullYear(), now.getMonth() - item.monthsAgo, item.day, 12, 0, 0);
    const createdAt = planned.getTime() > now.getTime() ? now : planned;
    return {
      id: `demo-${index + 1}`,
      kind: item.kind,
      labelKey: `content:intentions.${item.key}`,
      amountMinor: toMinor(item.amountMajor, currency),
      createdAt: createdAt.toISOString(),
    };
  });
}
