import type { Language } from '@/src/config/locale';

export type SpeakOptions = { language: Language };

export interface VoiceProvider {
  /** Resolves when the speech ends or is stopped. Rejects when it fails (for example no voice). */
  speak(text: string, options: SpeakOptions): Promise<void>;
  /** Optional: gets ready to speak this language (for example looks up the voice). Never rejects. */
  prepare?(options: SpeakOptions): Promise<void>;
  stop(): Promise<void>;
  isSpeaking(): Promise<boolean>;
}
