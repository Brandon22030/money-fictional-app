import { findFavorite } from '@/src/data/favorites';
import { transactionTitle } from '@/src/data/transactionTitle';
import type { Transaction } from '@/src/domain/types';
import i18n from '@/src/i18n';

const base: Transaction = {
  id: 'tx-1',
  kind: 'send',
  labelKey: 'content:intentions.sharedWith',
  labelParams: { contact: 'family' },
  amountMinor: 100,
  createdAt: '2026-10-01T12:00:00.000Z',
};

const tr = (key: string, options?: Record<string, unknown>) => i18n.t(key, options);

describe('findFavorite', () => {
  it('returns known favorites only', () => {
    expect(findFavorite('family')?.id).toBe('family');
    expect(findFavorite('Someone typed')).toBeUndefined();
    expect(findFavorite(undefined)).toBeUndefined();
  });
});

describe('transactionTitle', () => {
  it('resolves the favorite name in the current language', async () => {
    await i18n.changeLanguage('fr');
    expect(transactionTitle(base, tr)).toBe('Partagé avec Famille');
    await i18n.changeLanguage('en');
    expect(transactionTitle(base, tr)).toBe('Shared with Family');
  });

  it('falls back to the kind label when the contact is not a favorite', async () => {
    await i18n.changeLanguage('en');
    expect(transactionTitle({ ...base, labelParams: { contact: 'unknown' } }, tr)).toBe('Money sent');
  });

  it('translates plain labels unchanged', async () => {
    await i18n.changeLanguage('fr');
    const plain: Transaction = { ...base, labelKey: 'content:intentions.coffee', labelParams: undefined };
    expect(transactionTitle(plain, tr)).toBe('Café du matin');
  });
});
