import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

const CASH_COUNTER_SOURCE = require('../../../assets/sounds/cash-counter.m4a') as number;
const ATM_BEEP_SOURCE = require('../../../assets/sounds/atm-beep.m4a') as number;
// Safety nets a little above each sound (2 s and 0.3 s), in case the finish event never comes.
const CASH_COUNTER_MAX_WAIT_MS = 3000;
const ATM_BEEP_MAX_WAIT_MS = 1000;

type ActiveBeep = { player: AudioPlayer; finish: () => void };

let active: ActiveBeep | null = null;
let token = 0;

/** Plays the cash counter sound (about 2 s); resolves once finished, stopped or timed out. */
export function playCashCounter(): Promise<void> {
  return playSound(CASH_COUNTER_SOURCE, CASH_COUNTER_MAX_WAIT_MS);
}

/** Plays the single ATM beep (300 ms); resolves once finished, stopped or timed out. */
export function playAtmBeep(): Promise<void> {
  return playSound(ATM_BEEP_SOURCE, ATM_BEEP_MAX_WAIT_MS);
}

async function playSound(source: number, maxWaitMs: number): Promise<void> {
  stopBeep();
  const current = ++token;
  // mixWithOthers (the default, made explicit): the session kept active never stops other apps.
  await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
  // Stopped while the audio mode was being set: do not start a sound nobody wants.
  if (current !== token) return;

  // iOS: by default expo-audio deactivates the app audio session when a player finishes or is
  // paused. The voice (AVSpeechSynthesizer) speaks through that same shared session: once it
  // has spoken, every later deactivation cuts its audio output, so from the second announcement
  // on it kept "speaking" in silence. Keeping the session active (it mixes with other apps,
  // see setAudioModeAsync) leaves the voice audible at every announcement.
  // The session stays active, which has no effect with mixWithOthers; if the mode ever becomes
  // duckOthers or doNotMix, deactivate the session (setIsAudioActiveAsync(false)) at the end of
  // the announcement, otherwise other apps stay ducked or silenced.
  const player = createAudioPlayer(source, { keepAudioSessionActive: true });
  await new Promise<void>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let subscription: { remove: () => void } | undefined;
    let settled = false;

    const cleanup = () => {
      settled = true;
      if (timer !== undefined) clearTimeout(timer);
      subscription?.remove();
      if (active?.player === player) active = null;
      player.remove();
    };
    const finish = () => {
      if (settled) return;
      cleanup();
      resolve();
    };

    try {
      active = { player, finish };
      subscription = player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) finish();
      });
      timer = setTimeout(finish, maxWaitMs);
      player.play();
    } catch (error) {
      if (!settled) cleanup();
      reject(error);
    }
  });
}

/** Interrupts the sound in progress (counter or beep), if any, and releases its player. */
export function stopBeep(): void {
  token += 1;
  const current = active;
  if (!current) return;
  active = null;
  current.player.pause();
  current.finish();
}
