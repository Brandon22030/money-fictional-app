/**
 * MFA-008 non-regression: on iPhone the voice spoke at the first announcement only.
 *
 * The real pieces run together (announcer, cash counter and beep players, Expo Speech provider);
 * only the native modules are mocked, with the iOS behaviour that caused the bug:
 * - expo-audio deactivates the shared app audio session when a player finishes or is paused,
 *   unless the player was created with `keepAudioSessionActive`;
 * - AVSpeechSynthesizer speaks through that shared session: once it has spoken, a later
 *   deactivation cuts its audio output, and it then keeps "speaking" (onStart, onDone) in silence.
 */
import * as Speech from 'expo-speech';
import { createAudioPlayer } from 'expo-audio';

import { announceBalance, setVoiceProvider, stopAnnouncement } from '@/src/services/voice';

type Options = {
  voice?: string;
  language?: string;
  onDone?: () => void;
  onStopped?: () => void;
};

const AMELIE = 'com.apple.voice.compact.fr-CA.Amelie';
const SPEECH_MS = 1500;
const SOUND_MS = 300;

const native = {
  synthesizerHasOutput: false,
  synthesizerOutputCut: false,
  audible: [] as boolean[],
  pending: [] as { options: Options; timer: ReturnType<typeof setTimeout> }[],
  reset() {
    this.synthesizerHasOutput = false;
    this.synthesizerOutputCut = false;
    this.audible = [];
    this.pending = [];
  },
  deactivateSession() {
    if (this.synthesizerHasOutput) this.synthesizerOutputCut = true;
  },
};

jest.mock('expo-speech', () => ({
  VoiceQuality: { Default: 'Default', Enhanced: 'Enhanced' },
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn(async () => false),
  getAvailableVoicesAsync: jest.fn(),
}));

function mockNativeModules() {
  (Speech.getAvailableVoicesAsync as jest.Mock).mockResolvedValue([
    { identifier: AMELIE, name: 'Amélie', language: 'fr-CA', quality: 'Default' },
  ]);
  (Speech.speak as jest.Mock).mockImplementation((_text: string, options: Options) => {
    native.audible.push(!native.synthesizerOutputCut);
    native.synthesizerHasOutput = true;
    const entry = {
      options,
      timer: setTimeout(() => {
        native.pending = native.pending.filter((item) => item !== entry);
        options.onDone?.();
      }, SPEECH_MS),
    };
    native.pending.push(entry);
  });
  (Speech.stop as jest.Mock).mockImplementation(async () => {
    const stopped = native.pending;
    native.pending = [];
    stopped.forEach(({ options, timer }) => {
      clearTimeout(timer);
      options.onStopped?.();
    });
  });

  (createAudioPlayer as jest.Mock).mockImplementation(
    (_source: number, options?: { keepAudioSessionActive?: boolean }) => {
      const listeners: ((status: { didJustFinish: boolean }) => void)[] = [];
      const releaseSession = () => {
        if (!options?.keepAudioSessionActive) native.deactivateSession();
      };
      return {
        play: jest.fn(() => {
          setTimeout(() => {
            releaseSession();
            listeners.forEach((listener) => listener({ didJustFinish: true }));
          }, SOUND_MS);
        }),
        pause: jest.fn(releaseSession),
        remove: jest.fn(),
        addListener: jest.fn((_event: string, listener: (typeof listeners)[number]) => {
          listeners.push(listener);
          return { remove: jest.fn() };
        }),
      };
    },
  );
}

const params = {
  read: () => ({ amountMinor: 12345, currency: 'EUR' as const, language: 'fr' as const }),
  t: (_key: string, options?: Record<string, unknown>) => `solde ${String(options?.amount)}`,
};

const spokenWithAmelie = () =>
  (Speech.speak as jest.Mock).mock.calls.map(([, options]: [string, Options]) => options.voice);

describe('voice and the iOS audio session (MFA-008)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    native.reset();
    setVoiceProvider(null);
    mockNativeModules();
  });

  afterEach(async () => {
    await stopAnnouncement();
    setVoiceProvider(null);
    jest.useRealTimers();
  });

  it('one-shot: the 2nd and 3rd announcements speak with Amelie and stay audible', async () => {
    for (let i = 0; i < 3; i += 1) {
      const done = announceBalance(params);
      await jest.advanceTimersByTimeAsync(5000);
      await done;
    }

    expect(spokenWithAmelie()).toEqual([AMELIE, AMELIE, AMELIE]);
    expect(native.audible).toEqual([true, true, true]);
  });

  it('loop: cycles 2 and 3 speak with Amelie and stay audible', async () => {
    // Read before every new cycle: three cycles, then the loop ends on its own.
    const done = announceBalance({
      ...params,
      loop: () => (Speech.speak as jest.Mock).mock.calls.length < 3,
    });
    await jest.advanceTimersByTimeAsync(20000);
    await done;

    expect(spokenWithAmelie()).toEqual([AMELIE, AMELIE, AMELIE]);
    expect(native.audible).toEqual([true, true, true]);
  });

  it('a stop during the counter does not silence the next announcement', async () => {
    const first = announceBalance(params);
    await jest.advanceTimersByTimeAsync(5000);
    await first;

    const interrupted = announceBalance(params);
    await jest.advanceTimersByTimeAsync(100);
    await stopAnnouncement();
    await interrupted;

    const next = announceBalance(params);
    await jest.advanceTimersByTimeAsync(5000);
    await next;

    expect(spokenWithAmelie()).toEqual([AMELIE, AMELIE]);
    expect(native.audible).toEqual([true, true]);
  });
});
