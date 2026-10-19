import * as Speech from 'expo-speech';

import { ExpoSpeechVoiceProvider } from '@/src/services/voice/ExpoSpeechVoiceProvider';

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(async () => undefined),
  isSpeakingAsync: jest.fn(async () => false),
}));

type Callbacks = { onDone?: () => void; onStopped?: () => void; onError?: (e: Error) => void };

function lastCallbacks(): Callbacks {
  const calls = (Speech.speak as jest.Mock).mock.calls;
  return calls[calls.length - 1][1] as Callbacks;
}

describe('ExpoSpeechVoiceProvider', () => {
  afterEach(() => jest.clearAllMocks());

  it('resolves when the speech ends or is stopped', async () => {
    const provider = new ExpoSpeechVoiceProvider();
    const done = provider.speak('hello', { language: 'en' });
    lastCallbacks().onDone?.();
    await expect(done).resolves.toBeUndefined();

    const stopped = provider.speak('hello', { language: 'en' });
    lastCallbacks().onStopped?.();
    await expect(stopped).resolves.toBeUndefined();
  });

  it('rejects when the speech fails', async () => {
    const provider = new ExpoSpeechVoiceProvider();
    const pending = provider.speak('bonjour', { language: 'fr' });
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
});
