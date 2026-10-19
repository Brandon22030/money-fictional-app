import type { Currency, Language } from '@/src/config/locale';

import { playBeep } from './beep';
import { getVoiceProvider } from './registry';
import { spokenAmount } from './spokenAmount';

export type AnnounceBalanceParams = {
  amountMinor: number;
  currency: Currency;
  language: Language;
  t: (key: string, options?: Record<string, unknown>) => string;
};

let generation = 0;

/** Beep, then speak the balance. A beep failure never prevents the voice. */
export async function announceBalance({
  amountMinor,
  currency,
  language,
  t,
}: AnnounceBalanceParams): Promise<void> {
  generation += 1;
  const current = generation;

  try {
    await playBeep();
  } catch {
    // The voice still plays when the beep cannot.
  }
  if (current !== generation) return;

  const amount = spokenAmount(amountMinor, currency, language);
  const text = t('announce', { amount, lng: language });
  await getVoiceProvider().speak(text, { language });
}

/** Stops the current announcement, including one still waiting on the beep. */
export async function stopAnnouncement(): Promise<void> {
  generation += 1;
  await getVoiceProvider().stop();
}
