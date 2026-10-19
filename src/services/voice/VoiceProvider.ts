import type { Language } from '@/src/config/locale';

export type SpeakOptions = { language: Language };

export interface VoiceProvider {
  /** Resolves when the speech ends, is stopped, or fails. Never rejects for a missing voice. */
  speak(text: string, options: SpeakOptions): Promise<void>;
  stop(): Promise<void>;
  isSpeaking(): Promise<boolean>;
}
