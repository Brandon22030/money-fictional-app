import * as Speech from 'expo-speech';

import { ExpoSpeechVoiceProvider, pickFrenchVoice } from '@/src/services/voice/ExpoSpeechVoiceProvider';

jest.mock('expo-speech', () => ({
  VoiceQuality: { Default: 'Default', Enhanced: 'Enhanced' },
  speak: jest.fn(),
  stop: jest.fn(async () => undefined),
  isSpeakingAsync: jest.fn(async () => false),
  getAvailableVoicesAsync: jest.fn(async () => []),
}));

type Callbacks = { onDone?: () => void; onStopped?: () => void; onError?: (e: Error) => void };
type Voice = Speech.Voice;

const voice = (identifier: string, name: string, language: string, quality = 'Default'): Voice =>
  ({ identifier, name, language, quality }) as Voice;

const AMELIE = voice('com.apple.voice.compact.fr-CA.Amelie', 'Amélie', 'fr-CA');
const AMELIE_ENHANCED = voice('com.apple.voice.enhanced.fr-CA.Amelie', 'Amélie', 'fr-CA', 'Enhanced');
const FLO = voice('com.apple.eloquence.fr-FR.Flo', 'Flo', 'fr-FR');
const SANDY = voice('com.apple.eloquence.fr-FR.Sandy', 'Sandy', 'fr-FR');
const THOMAS = voice('com.apple.voice.compact.fr-FR.Thomas', 'Thomas', 'fr-FR');
const ENGLISH = voice('com.apple.voice.compact.en-US.Samantha', 'Samantha', 'en-US');

const calls = () => (Speech.speak as jest.Mock).mock.calls;
function lastCallbacks(): Callbacks {
  return calls()[calls().length - 1][1] as Callbacks;
}
const mockVoices = (voices: Voice[]) =>
  (Speech.getAvailableVoicesAsync as jest.Mock).mockResolvedValue(voices);
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('pickFrenchVoice', () => {
  it('prefers Amelie, and its enhanced variant over the compact one', () => {
    expect(pickFrenchVoice([FLO, AMELIE, THOMAS])).toBe(AMELIE);
    expect(pickFrenchVoice([FLO, AMELIE, AMELIE_ENHANCED])).toBe(AMELIE_ENHANCED);
  });

  it('matches Amelie by name too, without accent nor case', () => {
    const byName = voice('custom.id', 'AMÉLIE', 'fr-CA');
    expect(pickFrenchVoice([THOMAS, byName])).toBe(byName);
  });

  it('falls back to known female voices in priority order', () => {
    expect(pickFrenchVoice([THOMAS, SANDY, FLO])).toBe(FLO);
    expect(pickFrenchVoice([THOMAS, SANDY])).toBe(SANDY);
  });

  it('ignores non French voices, even with a female name', () => {
    expect(pickFrenchVoice([voice('x.Flo', 'Flo', 'en-US'), ENGLISH])).toBeNull();
  });

  it('picks a probable female local Android voice, never a network or male one', () => {
    const male = voice('fr-fr-x-frb-local', 'fr-fr-x-frb-local', 'fr-FR');
    const network = voice('fr-fr-x-fra-network', 'fr-fr-x-fra-network', 'fr-FR');
    const female = voice('fr-fr-x-vlf-local', 'fr-fr-x-vlf-local', 'fr-FR');
    expect(pickFrenchVoice([male, network, female])).toBe(female);
    expect(pickFrenchVoice([male, network])).toBeNull();
  });

  it('returns null when there is no female voice or no voice at all', () => {
    expect(pickFrenchVoice([THOMAS])).toBeNull();
    expect(pickFrenchVoice([])).toBeNull();
  });
});

describe('ExpoSpeechVoiceProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVoices([]);
  });

  it('resolves when the speech ends or is stopped', async () => {
    const provider = new ExpoSpeechVoiceProvider();
    const done = provider.speak('hello', { language: 'en' });
    await flush();
    lastCallbacks().onDone?.();
    await expect(done).resolves.toBeUndefined();

    const stopped = provider.speak('hello', { language: 'en' });
    await flush();
    lastCallbacks().onStopped?.();
    await expect(stopped).resolves.toBeUndefined();
  });

  it('rejects when the speech fails', async () => {
    const provider = new ExpoSpeechVoiceProvider();
    const pending = provider.speak('bonjour', { language: 'fr' });
    await flush();
    const error = new Error('no voice');
    lastCallbacks().onError?.(error);
    await expect(pending).rejects.toBe(error);
  });

  it('rejects when expo-speech throws', async () => {
    (Speech.speak as jest.Mock).mockImplementationOnce(() => {
      throw new Error('native failure');
    });
    await expect(new ExpoSpeechVoiceProvider().speak('x', { language: 'en' })).rejects.toThrow(
      'native failure',
    );
  });

  it('leaves English untouched: no voice lookup, no voice', async () => {
    mockVoices([AMELIE]);
    const provider = new ExpoSpeechVoiceProvider();
    const done = provider.speak('hello', { language: 'en' });
    await flush();
    expect(Speech.getAvailableVoicesAsync).not.toHaveBeenCalled();
    expect(calls()[0][1]).toEqual(expect.objectContaining({ language: 'en-US' }));
    expect(calls()[0][1]).not.toHaveProperty('voice');
    lastCallbacks().onDone?.();
    await done;
  });

  it('speaks French with Amelie and the fr-CA language when she is installed', async () => {
    mockVoices([FLO, AMELIE]);
    const done = new ExpoSpeechVoiceProvider().speak('bonjour', { language: 'fr' });
    await flush();
    expect(calls()[0][1]).toEqual(
      expect.objectContaining({ voice: AMELIE.identifier, language: 'fr-CA' }),
    );
    lastCallbacks().onDone?.();
    await done;
  });

  it('uses Flo with the fr-FR language when Amelie is absent', async () => {
    mockVoices([THOMAS, FLO]);
    const done = new ExpoSpeechVoiceProvider().speak('bonjour', { language: 'fr' });
    await flush();
    expect(calls()[0][1]).toEqual(
      expect.objectContaining({ voice: FLO.identifier, language: 'fr-FR' }),
    );
    lastCallbacks().onDone?.();
    await done;
  });

  it.each([
    ['no female voice', [THOMAS, ENGLISH]],
    ['an empty list', []],
  ])('falls back to the system voice with %s', async (_name, voices) => {
    mockVoices(voices);
    const done = new ExpoSpeechVoiceProvider().speak('bonjour', { language: 'fr' });
    await flush();
    expect(calls()[0][1]).toEqual(expect.objectContaining({ language: 'fr-FR' }));
    expect(calls()[0][1]).not.toHaveProperty('voice');
    lastCallbacks().onDone?.();
    await done;
  });

  it('still speaks when listing the voices fails, and tries again next time', async () => {
    (Speech.getAvailableVoicesAsync as jest.Mock).mockRejectedValueOnce(new Error('no list'));
    const provider = new ExpoSpeechVoiceProvider();
    const first = provider.speak('bonjour', { language: 'fr' });
    await flush();
    expect(calls()[0][1]).not.toHaveProperty('voice');
    lastCallbacks().onDone?.();
    await first;

    mockVoices([AMELIE]);
    const second = provider.speak('bonjour', { language: 'fr' });
    await flush();
    expect(calls()[1][1]).toEqual(expect.objectContaining({ voice: AMELIE.identifier }));
    lastCallbacks().onDone?.();
    await second;
  });

  it('chooses the voice once and caches it', async () => {
    mockVoices([AMELIE]);
    const provider = new ExpoSpeechVoiceProvider();
    for (let i = 0; i < 3; i += 1) {
      const done = provider.speak('bonjour', { language: 'fr' });
      await flush();
      lastCallbacks().onDone?.();
      await done;
    }
    expect(Speech.getAvailableVoicesAsync).toHaveBeenCalledTimes(1);
    expect(calls().every((call) => call[1].voice === AMELIE.identifier)).toBe(true);
  });

  it('retries once without the voice when speaking with it fails, then stops using it', async () => {
    mockVoices([AMELIE]);
    const provider = new ExpoSpeechVoiceProvider();
    const done = provider.speak('bonjour', { language: 'fr' });
    await flush();
    lastCallbacks().onError?.(new Error('voice missing'));
    await flush();
    expect(calls()).toHaveLength(2);
    expect(calls()[1][1]).not.toHaveProperty('voice');
    expect(calls()[1][1]).toEqual(expect.objectContaining({ language: 'fr-FR' }));
    lastCallbacks().onDone?.();
    await expect(done).resolves.toBeUndefined();

    const next = provider.speak('bonjour', { language: 'fr' });
    await flush();
    expect(calls()[2][1]).not.toHaveProperty('voice');
    lastCallbacks().onDone?.();
    await next;
  });

  it('rejects when the retry without the voice fails too', async () => {
    mockVoices([AMELIE]);
    const done = new ExpoSpeechVoiceProvider().speak('bonjour', { language: 'fr' });
    await flush();
    lastCallbacks().onError?.(new Error('first'));
    await flush();
    const second = new Error('second');
    lastCallbacks().onError?.(second);
    await expect(done).rejects.toBe(second);
    expect(calls()).toHaveLength(2);
  });
});
