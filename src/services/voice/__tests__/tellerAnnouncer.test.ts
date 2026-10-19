import { playBeep } from '@/src/services/voice/beep';
import {
  announceBalance,
  getVoiceProvider,
  setVoiceProvider,
  stopAnnouncement,
} from '@/src/services/voice';
import type { VoiceProvider } from '@/src/services/voice';

jest.mock('@/src/services/voice/beep', () => ({ playBeep: jest.fn() }));

const t = (key: string, options?: Record<string, unknown>) =>
  `${key}:${String(options?.amount)}:${String(options?.lng)}`;

function makeProvider(events: string[]): VoiceProvider {
  return {
    speak: jest.fn(async (text: string) => {
      events.push(`speak ${text}`);
    }),
    stop: jest.fn(async () => {
      events.push('stop');
    }),
    isSpeaking: jest.fn(async () => false),
  };
}

describe('tellerAnnouncer', () => {
  afterEach(() => {
    setVoiceProvider(null);
    jest.clearAllMocks();
  });

  it('finishes the beep before speaking, through the injected provider', async () => {
    const events: string[] = [];
    const provider = makeProvider(events);
    setVoiceProvider(provider);
    (playBeep as jest.Mock).mockImplementation(async () => {
      await Promise.resolve();
      events.push('beep done');
    });

    await announceBalance({
      amountMinor: 125050,
      currency: 'EUR',
      language: 'fr',
      t,
    });

    expect(getVoiceProvider()).toBe(provider);
    expect(events).toEqual(['beep done', 'speak announce:1250 euros et 50 centimes:fr']);
    expect(provider.speak).toHaveBeenCalledWith(expect.any(String), {
      language: 'fr',
    });
  });

  it('still speaks when the beep fails', async () => {
    const events: string[] = [];
    setVoiceProvider(makeProvider(events));
    (playBeep as jest.Mock).mockRejectedValue(new Error('no audio'));

    await announceBalance({
      amountMinor: 100,
      currency: 'USD',
      language: 'en',
      t,
    });

    expect(events).toEqual(['speak announce:1 dollar:en']);
  });

  it('does not speak when stopped during the beep', async () => {
    const events: string[] = [];
    setVoiceProvider(makeProvider(events));
    let release: () => void = () => undefined;
    (playBeep as jest.Mock).mockReturnValue(new Promise<void>((resolve) => (release = resolve)));

    const pending = announceBalance({
      amountMinor: 100,
      currency: 'USD',
      language: 'en',
      t,
    });
    await stopAnnouncement();
    release();
    await pending;

    expect(events).toEqual(['stop']);
  });
});
