import { AppState, type NativeEventSubscription } from 'react-native';

import type { Currency, Language } from '@/src/config/locale';

import { setAnnouncementActive } from './announcementState';
import { playBeep, stopBeep } from './beep';
import { getVoiceProvider } from './registry';
import { spokenAmount } from './spokenAmount';

/** Pause between the end of the voice and the next sound when the announcement loops. */
export const LOOP_PAUSE_MS = 2000;

export type AnnouncementSnapshot = {
  amountMinor: number;
  currency: Currency;
  language: Language;
};

export type AnnounceBalanceParams = {
  /** Called at every cycle, so a loop announces the balance as it is at that moment. */
  read: () => AnnouncementSnapshot;
  t: (key: string, options?: Record<string, unknown>) => string;
  loop?: boolean;
};

let generation = 0;
let pause: {
  timer: ReturnType<typeof setTimeout>;
  resolve: () => void;
} | null = null;
let appStateSubscription: NativeEventSubscription | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pause = null;
      resolve();
    }, ms);
    pause = { timer, resolve };
  });
}

function cancelPause(): void {
  if (!pause) return;
  clearTimeout(pause.timer);
  pause.resolve();
  pause = null;
}

/**
 * The announcement only runs in the foreground: when the app goes to the background it is
 * stopped, so the voice never keeps talking (and looping) behind another app.
 */
function watchAppState(): void {
  appStateSubscription?.remove();
  appStateSubscription = AppState.addEventListener('change', (state) => {
    if (state === 'background') void stopAnnouncement();
  });
}

function unwatchAppState(): void {
  appStateSubscription?.remove();
  appStateSubscription = null;
}

/** Beep, then speak the balance. A beep failure never prevents the voice. */
async function playCycle(current: number, { read, t }: AnnounceBalanceParams): Promise<void> {
  const provider = getVoiceProvider();
  // Never overlap a previous announcement, from this button or another one.
  await provider.stop();
  if (current !== generation) return;

  try {
    await playBeep();
  } catch {
    // The voice still plays when the beep cannot.
  }
  if (current !== generation) return;

  const { amountMinor, currency, language } = read();
  const amount = spokenAmount(amountMinor, currency, language);
  const text = t('announce', { amount, lng: language });
  await provider.speak(text, { language });
}

/**
 * Announces the balance once, or in a loop until stopAnnouncement. A newer call or a stop
 * cancels this one. If the voice provider fails, the announcement (and its loop) ends.
 */
export async function announceBalance(params: AnnounceBalanceParams): Promise<void> {
  generation += 1;
  const current = generation;
  cancelPause();
  setAnnouncementActive(true);
  watchAppState();

  try {
    do {
      await playCycle(current, params);
      if (current !== generation || !params.loop) break;
      await sleep(LOOP_PAUSE_MS);
    } while (current === generation);
  } catch {
    // A failing provider ends the loop instead of retrying forever.
  } finally {
    if (current === generation) {
      setAnnouncementActive(false);
      unwatchAppState();
    }
  }
}

/** Stops the current announcement: the beep, the voice and the pause before the next cycle. */
export async function stopAnnouncement(): Promise<void> {
  generation += 1;
  cancelPause();
  stopBeep();
  setAnnouncementActive(false);
  unwatchAppState();
  await getVoiceProvider().stop();
}
