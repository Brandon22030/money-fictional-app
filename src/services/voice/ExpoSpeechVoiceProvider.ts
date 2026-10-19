import * as Speech from 'expo-speech';

import { SPEECH_TAGS } from '@/src/config/locale';

import type { SpeakOptions, VoiceProvider } from './VoiceProvider';

export class ExpoSpeechVoiceProvider implements VoiceProvider {
  speak(text: string, { language }: SpeakOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        Speech.speak(text, {
          language: SPEECH_TAGS[language],
          onDone: () => resolve(),
          onStopped: () => resolve(),
          // Rejecting lets the caller end a loop that would otherwise beep with no voice.
          onError: (error) => reject(error),
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    await Speech.stop();
  }

  isSpeaking(): Promise<boolean> {
    return Speech.isSpeakingAsync();
  }
}
