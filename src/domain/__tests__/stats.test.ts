import type { Transaction } from '@/src/domain/types';
import { dailyDelta, monthlyTotals, shareByKind } from '@/src/domain/stats';

function tx(id: string, kind: Transaction['kind'], amountMinor: number, date: Date): Transaction {
  return { id, kind, labelKey: 'k', amountMinor, createdAt: date.toISOString() };
}

const now = new Date(2026, 9, 19, 15, 0, 0);
const data: Transaction[] = [
  tx('1', 'receive', 10000, new Date(2026, 9, 19, 9, 0)),
  tx('2', 'pay', 2500, new Date(2026, 9, 19, 11, 0)),
  tx('3', 'receive', 5000, new Date(2026, 9, 18, 11, 0)),
  tx('4', 'send', 3000, new Date(2026, 8, 2, 11, 0)),
  tx('5', 'withdraw', 1000, new Date(2026, 4, 30, 11, 0)),
  tx('6', 'receive', 9999, new Date(2026, 3, 30, 11, 0)),
];

describe('dailyDelta', () => {
  it('sums today signed amounts and computes the percent against the previous balance', () => {
    const result = dailyDelta(data, 107500, now);
    expect(result.amountMinor).toBe(7500);
    expect(result.percent).toBeCloseTo(7.5, 5);
  });

  it('returns zero percent when there is no previous balance', () => {
    expect(dailyDelta([], 0, now)).toEqual({ amountMinor: 0, percent: 0 });
  });
});

describe('monthlyTotals', () => {
  it('returns the last 6 months oldest first, ignoring older data', () => {
    const result = monthlyTotals(data, now, 6);
    expect(result.map((item) => item.month)).toEqual([
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
    ]);
    expect(result[0]).toEqual({ month: '2026-05', inMinor: 0, outMinor: 1000 });
    expect(result[4]).toEqual({ month: '2026-09', inMinor: 0, outMinor: 3000 });
    expect(result[5]).toEqual({ month: '2026-10', inMinor: 15000, outMinor: 2500 });
  });

  it('crosses the year boundary', () => {
    const result = monthlyTotals([], new Date(2026, 1, 10), 6);
    expect(result[0].month).toBe('2025-09');
    expect(result[5].month).toBe('2026-02');
  });
});

describe('shareByKind', () => {
  it('computes ratios over all kinds', () => {
    const result = shareByKind([
      tx('a', 'receive', 300, now),
      tx('b', 'pay', 100, now),
      tx('c', 'pay', 100, now),
    ]);
    expect(result.find((item) => item.kind === 'receive')?.ratio).toBeCloseTo(0.6);
    expect(result.find((item) => item.kind === 'pay')?.amountMinor).toBe(200);
    expect(result.find((item) => item.kind === 'send')?.ratio).toBe(0);
  });

  it('returns zero ratios for empty input', () => {
    expect(shareByKind([]).every((item) => item.ratio === 0)).toBe(true);
  });
});
