import { playBeep, stopBeep } from '@/src/services/voice/beep';
import {
  announceBalance,
  getVoiceProvider,
  setVoiceProvider,
  stopAnnouncement,
} from '@/src/services/voice';
import type { VoiceProvider } from '@/src/services/voice';

jest.mock('@/src/services/voice/beep', () => ({ playBeep: jest.fn(), stopBeep: jest.fn() }));

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
    expect(events).toEqual(['stop', 'beep done', 'speak announce:1250 euros et 50 centimes:fr']);
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

    expect(events).toEqual(['stop', 'speak announce:1 dollar:en']);
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

    expect(events).toEqual(['stop', 'stop']);
    expect(events.some((event) => event.startsWith('speak'))).toBe(false);
  });

  it('stops the previous speech before speaking again', async () => {
    const events: string[] = [];
    const provider = makeProvider(events);
    setVoiceProvider(provider);
    (playBeep as jest.Mock).mockResolvedValue(undefined);

    await announceBalance({ amountMinor: 100, currency: 'USD', language: 'en', t });

    const stopOrder = (provider.stop as jest.Mock).mock.invocationCallOrder[0];
    const speakOrder = (provider.speak as jest.Mock).mock.invocationCallOrder[0];
    expect(stopOrder).toBeLessThan(speakOrder as number);
  });

  it('interrupts the beep in progress when stopped', async () => {
    setVoiceProvider(makeProvider([]));
    await stopAnnouncement();
    expect(stopBeep).toHaveBeenCalledTimes(1);
  });
});
