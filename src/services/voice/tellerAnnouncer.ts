import { AppState, type NativeEventSubscription } from 'react-native';

import type { Currency, Language } from '@/src/config/locale';

import { setAnnouncementActive } from './announcementState';
import { playAtmBeep, playCashCounter, stopBeep } from './beep';
import { getVoiceProvider } from './registry';
import { spokenAmount } from './spokenAmount';

/** Pause between the end of the voice and the next sound when the announcement loops. */
export const LOOP_PAUSE_MS = 2000;
/** Silence between the end of the cash counter and the ATM beep. */
export const COUNTER_TO_BEEP_MS = 150;
/** Silence between the end of the ATM beep and the voice. */
export const BEEP_TO_VOICE_MS = 250;

export type AnnouncementSnapshot = {
  amountMinor: number;
  currency: Currency;
  language: Language;
};

export type AnnounceBalanceParams = {
  /** Called at every cycle, so a loop announces the balance as it is at that moment. */
  read: () => AnnouncementSnapshot;
  t: (key: string, options?: Record<string, unknown>) => string;
  /**
   * Repeat the announcement. A function is read again before every new cycle, so turning the
   * setting off (or resetting the app) during a loop ends it after the current cycle.
   */
  loop?: boolean | (() => boolean);
};

function shouldLoop(loop: AnnounceBalanceParams['loop']): boolean {
  return typeof loop === 'function' ? loop() : loop === true;
}

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
 *
 * "inactive" is deliberately ignored (Control Center, notification shade, app switcher). On iOS
 * a phone call can leave the app only inactive: the loop then keeps running, but the system
 * interrupts the audio session, so the sounds and the voice are silenced until the call ends.
 * If the call moves the app to the background, the announcement stops as usual.
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

/** Plays a sound; a failure never prevents the next step of the sequence. */
async function playSoundSafely(play: () => Promise<void>): Promise<void> {
  try {
    await play();
  } catch {
    // The rest of the sequence (and the voice) still plays when a sound cannot.
  }
}

/**
 * Cash counter, silence, ATM beep, silence, then the voice. Each step starts only when the
 * previous one is over, and a stop (generation change) ends the cycle at any step.
 */
async function playCycle(current: number, { read, t }: AnnounceBalanceParams): Promise<void> {
  const provider = getVoiceProvider();
  // Never overlap a previous announcement, from this button or another one.
  await provider.stop();
  if (current !== generation) return;

  // Looks up the voice while the sounds play, so the voice follows the beep without delay.
  void provider.prepare?.({ language: read().language });
  await playSoundSafely(playCashCounter);
  if (current !== generation) return;
  await sleep(COUNTER_TO_BEEP_MS);
  if (current !== generation) return;

  await playSoundSafely(playAtmBeep);
  if (current !== generation) return;
  await sleep(BEEP_TO_VOICE_MS);
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
      if (current !== generation || !shouldLoop(params.loop)) break;
      await sleep(LOOP_PAUSE_MS);
    } while (current === generation && shouldLoop(params.loop));
  } catch (error) {
    // A failing provider (for example no voice for the language) ends the loop instead of
    // beeping forever with no voice. A one-shot announcement ends the same way.
    if (__DEV__) console.warn('Balance announcement failed', error);
  } finally {
    if (current === generation) {
      setAnnouncementActive(false);
      unwatchAppState();
    }
  }
}

/**
 * Stops the current announcement: the sounds, the voice, the silences and the pause before the next cycle.
 * Never rejects, so callers can fire and forget it (`void stopAnnouncement()`), for example
 * from the AppState listener: the announcement is already marked as stopped either way.
 */
export async function stopAnnouncement(): Promise<void> {
  generation += 1;
  cancelPause();
  stopBeep();
  setAnnouncementActive(false);
  unwatchAppState();
  try {
    await getVoiceProvider().stop();
  } catch (error) {
    if (__DEV__) console.warn('Stopping the voice failed', error);
  }
}
