import { getDemoTransactions } from '@/src/data/intentions';
import { dailyDelta } from '@/src/domain/stats';

function sameDay(iso: string, now: Date): boolean {
  const date = new Date(iso);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

describe('getDemoTransactions early in the month', () => {
  it.each([1, 2, 3, 4])('on day %i, never dates a demo intention today or in the future', (day) => {
    const now = new Date(2026, 9, day, 9, 0);
    const list = getDemoTransactions('EUR', now);
    expect(list).toHaveLength(12);
    expect(list.every((tx) => new Date(tx.createdAt).getTime() <= now.getTime())).toBe(true);
    expect(list.filter((tx) => sameDay(tx.createdAt, now))).toEqual([]);
  });

  it('moves a not yet reached demo day to the previous month', () => {
    const now = new Date(2026, 9, 1, 9, 0);
    const list = getDemoTransactions('EUR', now);
    const fruit = list.find((tx) => tx.labelKey === 'content:intentions.fruit');
    const music = list.find((tx) => tx.labelKey === 'content:intentions.music');
    expect(new Date(fruit!.createdAt)).toEqual(new Date(2026, 8, 4, 12, 0, 0));
    expect(new Date(music!.createdAt)).toEqual(new Date(2026, 8, 2, 12, 0, 0));
  });

  it('gives a zero daily delta on the 1st when only demo data exists', () => {
    const now = new Date(2026, 9, 1, 9, 0);
    expect(dailyDelta(getDemoTransactions('EUR', now), 100000, now)).toEqual({ amountMinor: 0, percent: 0 });
  });
});
