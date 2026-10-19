import { AFFIRMATION_KEYS, getAffirmationOfTheDay } from '@/src/data/affirmations';
import { getDemoTransactions } from '@/src/data/intentions';
import { resources } from '@/src/i18n';

describe('affirmations', () => {
  it('has at least 30 keys, all present in both locales', () => {
    expect(AFFIRMATION_KEYS.length).toBeGreaterThanOrEqual(30);
    for (const key of AFFIRMATION_KEYS) {
      const id = key.replace('content:affirmations.', '');
      expect(resources.fr.content.affirmations).toHaveProperty(id);
      expect(resources.en.content.affirmations).toHaveProperty(id);
    }
  });

  it('is deterministic for a given day and varies across days', () => {
    const a = getAffirmationOfTheDay(new Date(2026, 9, 19, 8));
    const b = getAffirmationOfTheDay(new Date(2026, 9, 19, 22));
    const c = getAffirmationOfTheDay(new Date(2026, 9, 20, 8));
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(AFFIRMATION_KEYS).toContain(a);
  });
});

describe('demo transactions', () => {
  it('spreads about 12 intentions over 6 months, none in the future', () => {
    const now = new Date(2026, 9, 2, 8, 0);
    const list = getDemoTransactions('EUR', now);
    expect(list).toHaveLength(12);
    expect(new Set(list.map((tx) => tx.createdAt.slice(0, 7))).size).toBeGreaterThanOrEqual(6);
    expect(list.every((tx) => new Date(tx.createdAt).getTime() <= now.getTime())).toBe(true);
  });
});
