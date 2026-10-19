import * as Speech from 'expo-speech';

import { SPEECH_TAGS, type Language } from '@/src/config/locale';

import type { SpeakOptions, VoiceProvider } from './VoiceProvider';

// Product choice: Amelie (fr-CA) is the voice picked by the user and comes first, even for French
// from France. She is spoken with the fr-CA language tag, which her voice requires.
const AMELIE_LANGUAGE = 'fr-CA';
// Known female French voices (iOS names), after Amelie. Compared without accent nor case.
const FEMALE_FRENCH_NAMES = ['audrey', 'aurelie', 'flo', 'shelley', 'sandy', 'grandma'];
// Android exposes no gender for its voices: this is only a heuristic, from the codes Google puts
// in its French voice identifiers (fr-FR and fr-CA) that are female voices today. Nothing
// guarantees it on every device or version; when nothing matches, the system voice is used.
const ANDROID_FEMALE_CODES = ['fra', 'frc', 'vlf', 'caa', 'cac'];

const normalize = (value: string | undefined): string =>
  (value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const isFrench = (voice: Speech.Voice): boolean =>
  normalize(voice.language).replace('_', '-').startsWith('fr');

const isEnhanced = (voice: Speech.Voice): boolean => voice.quality === Speech.VoiceQuality.Enhanced;

/**
 * Whether the voice carries this first name: the last segment of its identifier
 * ("com.apple.voice.compact.fr-CA.Amelie", "com.apple.ttsbundle.Amelie-compact") or its exact
 * name ("Amélie", "Amélie (Enhanced)"), without accent nor case. "flo" never matches "Florian".
 */
function hasName(voice: Speech.Voice, name: string): boolean {
  const lastSegment = normalize(voice.identifier).split('.').pop() ?? '';
  const idName = lastSegment.split(/[-_]/)[0];
  const displayName = normalize(voice.name).replace(/\s*\(.*\)\s*$/, '').trim();
  return idName === name || displayName === name;
}

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
  const named = (name: string) => french.filter((v) => hasName(v, name));

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

export class ExpoSpeechVoiceProvider implements VoiceProvider {
  // undefined: not chosen yet. null: chosen, no specific voice (system default).
  private frenchVoice: Speech.Voice | null | undefined;
  // The lookup in progress, shared so that prepare and speak never list the voices twice at once.
  private lookup: Promise<Speech.Voice | null> | null = null;
  // Incremented by every stop: a speak started before a stop never speaks after it.
  private stopCount = 0;

  /** The French voice is chosen once and cached. A failed or empty lookup is retried later. */
  private getFrenchVoice(): Promise<Speech.Voice | null> {
    if (this.frenchVoice !== undefined) return Promise.resolve(this.frenchVoice);
    this.lookup ??= this.lookUpFrenchVoice().finally(() => {
      this.lookup = null;
    });
    return this.lookup;
  }

  private async lookUpFrenchVoice(): Promise<Speech.Voice | null> {
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

  /** Looks up the voice ahead of speak (for example during the sounds). Never rejects. */
  async prepare({ language }: SpeakOptions): Promise<void> {
    if (language === 'fr') await this.getFrenchVoice();
  }

  async speak(text: string, { language }: SpeakOptions): Promise<void> {
    const stopCount = this.stopCount;
    const voice = language === 'fr' ? await this.getFrenchVoice() : null;
    // Stopped while looking up the voice: never speak after the stop.
    if (stopCount !== this.stopCount) return;
    if (!voice) return this.speakWith(text, language);
    try {
      await this.speakWith(text, language, voice);
    } catch (error) {
      // The chosen voice does not work (removed, not downloaded): this announcement uses the
      // system voice, and the next one chooses again (the voice may be back by then).
      this.frenchVoice = undefined;
      if (stopCount !== this.stopCount) return;
      if (__DEV__) console.warn('Chosen voice failed, retrying without it', error);
      await this.speakWith(text, language);
    }
  }

  private speakWith(text: string, language: Language, voice?: Speech.Voice): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        Speech.speak(text, {
          language: voice && hasName(voice, 'amelie') ? AMELIE_LANGUAGE : SPEECH_TAGS[language],
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
    this.stopCount += 1;
    await Speech.stop();
  }

  isSpeaking(): Promise<boolean> {
    return Speech.isSpeakingAsync();
  }
}
