import { ExpoSpeechVoiceProvider } from './ExpoSpeechVoiceProvider';
import type { VoiceProvider } from './VoiceProvider';

let provider: VoiceProvider | null = null;

export function getVoiceProvider(): VoiceProvider {
  provider ??= new ExpoSpeechVoiceProvider();
  return provider;
}

/** Injection point: pass a custom provider (premium voice, test double) or null to reset. */
export function setVoiceProvider(next: VoiceProvider | null): void {
  provider = next;
}
