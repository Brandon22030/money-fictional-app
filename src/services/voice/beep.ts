import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

const BEEP_SOURCE = require('../../../assets/sounds/teller-beep.wav') as number;
const MAX_WAIT_MS = 1500;

type ActiveBeep = { player: AudioPlayer; finish: () => void };

let active: ActiveBeep | null = null;
let token = 0;

/** Plays the teller beep and resolves once it has finished, been stopped, or timed out. */
export async function playBeep(): Promise<void> {
  stopBeep();
  const current = ++token;
  await setAudioModeAsync({ playsInSilentMode: true });
  // Stopped while the audio mode was being set: do not start a beep nobody wants.
  if (current !== token) return;

  const player = createAudioPlayer(BEEP_SOURCE);
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
      timer = setTimeout(finish, MAX_WAIT_MS);
      player.play();
    } catch (error) {
      if (!settled) cleanup();
      reject(error);
    }
  });
}

/** Interrupts the beep in progress, if any, and releases its player. */
export function stopBeep(): void {
  token += 1;
  const current = active;
  if (!current) return;
  active = null;
  current.player.pause();
  current.finish();
}
