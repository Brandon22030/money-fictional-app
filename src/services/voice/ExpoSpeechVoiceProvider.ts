import * as Speech from 'expo-speech';

import { SPEECH_TAGS, type Language } from '@/src/config/locale';

import type { SpeakOptions, VoiceProvider } from './VoiceProvider';

const AMELIE_LANGUAGE = 'fr-CA';
// Known female French voices (iOS names), after Amelie. Compared without accent nor case.
const FEMALE_FRENCH_NAMES = ['audrey', 'aurelie', 'flo', 'shelley', 'sandy', 'grandma'];
// Android voice codes that are female in the Google French voices (fr-FR and fr-CA).
const ANDROID_FEMALE_CODES = ['fra', 'frc', 'vlf', 'caa', 'cac'];

const normalize = (value: string | undefined): string =>
  (value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const isFrench = (voice: Speech.Voice): boolean =>
  normalize(voice.language).replace('_', '-').startsWith('fr');

const isEnhanced = (voice: Speech.Voice): boolean => voice.quality === Speech.VoiceQuality.Enhanced;

/** Enhanced or premium variants first, otherwise the first one in the system order. */
function best(voices: Speech.Voice[]): Speech.Voice | undefined {
  return voices.find(isEnhanced) ?? voices[0];
}

/**
 * The French voice to use, or null to let the system pick (language fr-FR): Amelie first, then
 * known female voices (in that priority order), then probable female local Android voices.
 */
export function pickFrenchVoice(voices: Speech.Voice[]): Speech.Voice | null {
  const french = voices.filter(isFrench);
  const named = (name: string) =>
    french.filter((v) => normalize(v.identifier).includes(name) || normalize(v.name).includes(name));

  const amelie = best(named('amelie'));
  if (amelie) return amelie;
  for (const name of FEMALE_FRENCH_NAMES) {
    const found = best(named(name));
    if (found) return found;
  }
  const android = french.filter((v) => {
    const id = normalize(v.identifier);
    return id.endsWith('-local') && ANDROID_FEMALE_CODES.some((code) => id.includes(`-x-${code}-`));
  });
  return best(android) ?? null;
}

function isAmelie(voice: Speech.Voice): boolean {
  return normalize(voice.identifier).includes('amelie') || normalize(voice.name).includes('amelie');
}

export class ExpoSpeechVoiceProvider implements VoiceProvider {
  // undefined: not chosen yet. null: chosen, no specific voice (system default).
  private frenchVoice: Speech.Voice | null | undefined;

  /** The French voice is chosen once and cached. A failed or empty lookup is retried later. */
  private async getFrenchVoice(): Promise<Speech.Voice | null> {
    if (this.frenchVoice !== undefined) return this.frenchVoice;
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      if (voices.length === 0) return null;
      this.frenchVoice = pickFrenchVoice(voices);
      if (__DEV__) {
        console.log('Voice selected for French', this.frenchVoice?.identifier ?? 'system default');
      }
      return this.frenchVoice;
    } catch (error) {
      if (__DEV__) console.warn('Listing the voices failed', error);
      return null;
    }
  }

  async speak(text: string, { language }: SpeakOptions): Promise<void> {
    const voice = language === 'fr' ? await this.getFrenchVoice() : null;
    if (!voice) return this.speakWith(text, language);
    try {
      await this.speakWith(text, language, voice);
    } catch (error) {
      // The chosen voice does not work (removed, not downloaded): use the system voice instead.
      if (__DEV__) console.warn('Chosen voice failed, retrying without it', error);
      this.frenchVoice = null;
      await this.speakWith(text, language);
    }
  }

  private speakWith(text: string, language: Language, voice?: Speech.Voice): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        Speech.speak(text, {
          language: voice && isAmelie(voice) ? AMELIE_LANGUAGE : SPEECH_TAGS[language],
          ...(voice ? { voice: voice.identifier } : {}),
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
