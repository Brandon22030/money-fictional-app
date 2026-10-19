import type { Transaction } from '@/src/domain/types';

import { findFavorite } from './favorites';

type Translate = (key: string, options?: Record<string, unknown>) => string;

/**
 * Translated title of a transaction. A `contact` label parameter holds a favorite id,
 * resolved to its name at render time so it follows the current language.
 */
export function transactionTitle(transaction: Transaction, t: Translate): string {
  const params = transaction.labelParams;
  if (params?.contact === undefined) return t(transaction.labelKey, params);
  const favorite = findFavorite(params.contact);
  if (!favorite) return t(`content:intentions.${transaction.kind}`);
  return t(transaction.labelKey, { ...params, name: t(favorite.nameKey) });
}
