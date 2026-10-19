import * as Speech from 'expo-speech';

import { SPEECH_TAGS } from '@/src/config/locale';

import type { SpeakOptions, VoiceProvider } from './VoiceProvider';

export class ExpoSpeechVoiceProvider implements VoiceProvider {
  speak(text: string, { language }: SpeakOptions): Promise<void> {
    return new Promise((resolve) => {
      try {
        Speech.speak(text, {
          language: SPEECH_TAGS[language],
          onDone: () => resolve(),
          onStopped: () => resolve(),
          onError: () => resolve(),
        });
      } catch {
        resolve();
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
