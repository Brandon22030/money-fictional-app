import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

const BEEP_SOURCE = require('../../../assets/sounds/teller-beep.wav') as number;
const MAX_WAIT_MS = 1500;

/** Plays the teller beep and resolves once it has finished (or after a safety timeout). */
export async function playBeep(): Promise<void> {
  await setAudioModeAsync({ playsInSilentMode: true });
  const player = createAudioPlayer(BEEP_SOURCE);
  try {
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, MAX_WAIT_MS);
      player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          clearTimeout(timer);
          resolve();
        }
      });
      player.play();
    });
  } finally {
    player.remove();
  }
}
