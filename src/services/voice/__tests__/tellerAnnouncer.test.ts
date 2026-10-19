import { AppState } from 'react-native';

import { playBeep, stopBeep } from '@/src/services/voice/beep';
import {
  announceBalance,
  LOOP_PAUSE_MS,
  getVoiceProvider,
  setVoiceProvider,
  stopAnnouncement,
} from '@/src/services/voice';
import type { VoiceProvider } from '@/src/services/voice';
import { useAnnouncementState } from '@/src/services/voice/announcementState';

jest.mock('@/src/services/voice/beep', () => ({
  playBeep: jest.fn(),
  stopBeep: jest.fn(),
}));

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
      read: () => ({ amountMinor: 125050, currency: 'EUR', language: 'fr' }),
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
      read: () => ({ amountMinor: 100, currency: 'USD', language: 'en' }),
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
      read: () => ({ amountMinor: 100, currency: 'USD', language: 'en' }),
      t,
    });
    // Let announceBalance get past provider.stop() so the beep is really in progress.
    for (let i = 0; i < 10 && (playBeep as jest.Mock).mock.calls.length === 0; i += 1) {
      await Promise.resolve();
    }
    expect(playBeep).toHaveBeenCalledTimes(1);
    await stopAnnouncement();
    release();
    await pending;

    expect(playBeep).toHaveBeenCalledTimes(1);
    expect(events).toEqual(['stop', 'stop']);
    expect(events.some((event) => event.startsWith('speak'))).toBe(false);
  });

  it('stops the previous speech before speaking again', async () => {
    const events: string[] = [];
    const provider = makeProvider(events);
    setVoiceProvider(provider);
    (playBeep as jest.Mock).mockResolvedValue(undefined);

    await announceBalance({
      read: () => ({ amountMinor: 100, currency: 'USD', language: 'en' }),
      t,
    });

    const stopOrder = (provider.stop as jest.Mock).mock.invocationCallOrder[0];
    const speakOrder = (provider.speak as jest.Mock).mock.invocationCallOrder[0];
    expect(stopOrder).toBeLessThan(speakOrder as number);
  });

  it('interrupts the beep in progress when stopped', async () => {
    setVoiceProvider(makeProvider([]));
    await stopAnnouncement();
    expect(stopBeep).toHaveBeenCalledTimes(1);
  });

  it('announces once and goes inactive when the loop is off', async () => {
    setVoiceProvider(makeProvider([]));
    (playBeep as jest.Mock).mockResolvedValue(undefined);
    const pending = announceBalance({
      read: () => ({ amountMinor: 100, currency: 'USD', language: 'en' }),
      t,
    });
    expect(useAnnouncementState.getState().active).toBe(true);
    await pending;
    expect(playBeep).toHaveBeenCalledTimes(1);
    expect(useAnnouncementState.getState().active).toBe(false);
  });

  it('settles without rejecting when a one-shot announcement fails', async () => {
    const provider = makeProvider([]);
    provider.speak = jest.fn(async () => {
      throw new Error('no voice');
    });
    setVoiceProvider(provider);
    (playBeep as jest.Mock).mockResolvedValue(undefined);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(
      announceBalance({
        read: () => ({ amountMinor: 100, currency: 'USD', language: 'en' }),
        t,
      }),
    ).resolves.toBeUndefined();
    expect(useAnnouncementState.getState().active).toBe(false);
    warn.mockRestore();
  });

  describe('loop', () => {
    let events: string[];
    let balance: number;
    let appStateHandler: (state: string) => void;
    const removeAppState = jest.fn();

    const start = () =>
      announceBalance({
        read: () => ({ amountMinor: balance, currency: 'USD', language: 'en' }),
        t,
        loop: true,
      });
    const settle = async () => {
      for (let i = 0; i < 20; i += 1) await Promise.resolve();
    };

    beforeEach(() => {
      jest.useFakeTimers();
      events = [];
      balance = 100;
      setVoiceProvider(makeProvider(events));
      (playBeep as jest.Mock).mockImplementation(async () => {
        events.push('beep');
      });
      jest.spyOn(AppState, 'addEventListener').mockImplementation(((
        _type: string,
        handler: (state: string) => void,
      ) => {
        appStateHandler = handler;
        return { remove: removeAppState };
      }) as never);
    });

    afterEach(async () => {
      await stopAnnouncement();
      jest.useRealTimers();
      jest.restoreAllMocks();
      removeAppState.mockClear();
    });

    it('chains cycles separated by the pause, with the balance read again each time', async () => {
      void start();
      await settle();
      expect(events).toEqual(['stop', 'beep', 'speak announce:1 dollar:en']);
      expect(useAnnouncementState.getState().active).toBe(true);

      // Still inside the pause: nothing new yet.
      await jest.advanceTimersByTimeAsync(LOOP_PAUSE_MS - 1);
      expect(playBeep).toHaveBeenCalledTimes(1);

      balance = 250;
      await jest.advanceTimersByTimeAsync(1);
      await settle();
      expect(playBeep).toHaveBeenCalledTimes(2);
      expect(events.at(-1)).toBe('speak announce:2 dollars and 50 cents:en');
      expect(useAnnouncementState.getState().active).toBe(true);
    });

    it('stops during the pause without starting another cycle', async () => {
      void start();
      await settle();
      await jest.advanceTimersByTimeAsync(500);
      await stopAnnouncement();
      await jest.advanceTimersByTimeAsync(LOOP_PAUSE_MS * 3);
      await settle();
      expect(playBeep).toHaveBeenCalledTimes(1);
      expect(useAnnouncementState.getState().active).toBe(false);
      expect(jest.getTimerCount()).toBe(0);
    });

    it('stops during the voice: no pause, no new cycle', async () => {
      let release: () => void = () => undefined;
      const provider = makeProvider(events);
      provider.speak = jest.fn(() => new Promise<void>((resolve) => (release = resolve)));
      provider.stop = jest.fn(async () => release());
      setVoiceProvider(provider);

      const pending = start();
      await settle();
      expect(provider.speak).toHaveBeenCalledTimes(1);
      await stopAnnouncement();
      await pending;
      expect(jest.getTimerCount()).toBe(0);
      await jest.advanceTimersByTimeAsync(LOOP_PAUSE_MS * 2);
      expect(provider.speak).toHaveBeenCalledTimes(1);
      expect(useAnnouncementState.getState().active).toBe(false);
    });

    it('stops during the beep: the voice never starts', async () => {
      let release: () => void = () => undefined;
      (playBeep as jest.Mock).mockReturnValue(new Promise<void>((resolve) => (release = resolve)));
      const pending = start();
      await settle();
      await stopAnnouncement();
      release();
      await pending;
      expect(events.some((event) => event.startsWith('speak'))).toBe(false);
      expect(jest.getTimerCount()).toBe(0);
    });

    it('does not stack cycles when started again while looping', async () => {
      void start();
      await settle();
      void start();
      await settle();
      await jest.advanceTimersByTimeAsync(LOOP_PAUSE_MS);
      await settle();
      // Two starts played one cycle each, then only the second loop continued.
      expect(playBeep).toHaveBeenCalledTimes(3);
      await jest.advanceTimersByTimeAsync(LOOP_PAUSE_MS);
      await settle();
      expect(playBeep).toHaveBeenCalledTimes(4);
    });

    it('ends the loop when the voice provider fails', async () => {
      const provider = makeProvider(events);
      provider.speak = jest.fn(async () => {
        throw new Error('no voice');
      });
      setVoiceProvider(provider);
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      await start();
      expect(warn).toHaveBeenCalledWith('Balance announcement failed', expect.any(Error));
      expect(useAnnouncementState.getState().active).toBe(false);
      await jest.advanceTimersByTimeAsync(LOOP_PAUSE_MS * 2);
      expect(provider.speak).toHaveBeenCalledTimes(1);
      expect(removeAppState).toHaveBeenCalled();
    });

    it('stops when the app goes to the background but not when it becomes inactive', async () => {
      void start();
      await settle();
      appStateHandler('inactive');
      appStateHandler('active');
      expect(useAnnouncementState.getState().active).toBe(true);

      appStateHandler('background');
      await settle();
      expect(useAnnouncementState.getState().active).toBe(false);
      expect(stopBeep).toHaveBeenCalled();
      await jest.advanceTimersByTimeAsync(LOOP_PAUSE_MS * 2);
      expect(playBeep).toHaveBeenCalledTimes(1);
      expect(removeAppState).toHaveBeenCalled();
    });
  });
});
