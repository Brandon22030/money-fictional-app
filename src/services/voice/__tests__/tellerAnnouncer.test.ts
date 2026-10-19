import { AppState } from 'react-native';

import { playAtmBeep, playCashCounter, stopBeep } from '@/src/services/voice/beep';
import {
  announceBalance,
  BEEP_TO_VOICE_MS,
  COUNTER_TO_BEEP_MS,
  LOOP_PAUSE_MS,
  getVoiceProvider,
  setVoiceProvider,
  stopAnnouncement,
} from '@/src/services/voice';
import type { VoiceProvider } from '@/src/services/voice';
import { useAnnouncementState } from '@/src/services/voice/announcementState';

jest.mock('@/src/services/voice/beep', () => ({
  playCashCounter: jest.fn(),
  playAtmBeep: jest.fn(),
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

const SEQUENCE_MS = COUNTER_TO_BEEP_MS + BEEP_TO_VOICE_MS;
const params = (language: 'fr' | 'en' = 'en') => ({
  read: () => ({ amountMinor: 100, currency: 'USD' as const, language }),
  t,
});
const settle = async () => {
  for (let i = 0; i < 20; i += 1) await Promise.resolve();
};
const deferred = () => {
  let release: () => void = () => undefined;
  const promise = new Promise<void>((resolve) => (release = resolve));
  return { promise, release: () => release() };
};

describe('tellerAnnouncer', () => {
  let events: string[];

  beforeEach(() => {
    jest.useFakeTimers();
    events = [];
    (playCashCounter as jest.Mock).mockImplementation(async () => {
      events.push('counter');
    });
    (playAtmBeep as jest.Mock).mockImplementation(async () => {
      events.push('beep');
    });
  });

  afterEach(async () => {
    await stopAnnouncement();
    setVoiceProvider(null);
    jest.useRealTimers();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('plays counter, silence, beep, silence, then the voice, each step after the previous', async () => {
    const provider = makeProvider(events);
    setVoiceProvider(provider);
    // Mark the silences by recording the fake clock in each event.
    const at = () => Date.now();
    const start = at();
    (playCashCounter as jest.Mock).mockImplementation(async () => {
      events.push(`counter@${at() - start}`);
    });
    (playAtmBeep as jest.Mock).mockImplementation(async () => {
      events.push(`beep@${at() - start}`);
    });
    (provider.speak as jest.Mock).mockImplementation(async (text: string) => {
      events.push(`speak@${at() - start} ${text}`);
    });

    const pending = announceBalance(params('fr'));
    await jest.advanceTimersByTimeAsync(COUNTER_TO_BEEP_MS + BEEP_TO_VOICE_MS);
    await pending;

    expect(getVoiceProvider()).toBe(provider);
    expect(COUNTER_TO_BEEP_MS).toBe(150);
    expect(BEEP_TO_VOICE_MS).toBe(250);
    expect(events).toEqual([
      'stop',
      'counter@0',
      `beep@${COUNTER_TO_BEEP_MS}`,
      `speak@${COUNTER_TO_BEEP_MS + BEEP_TO_VOICE_MS} announce:1 dollar:fr`,
    ]);
    expect(provider.speak).toHaveBeenCalledWith(expect.any(String), { language: 'fr' });
  });

  it('starts the beep only when the counter ends, and the voice only when the beep ends', async () => {
    setVoiceProvider(makeProvider(events));
    const counter = deferred();
    const beep = deferred();
    (playCashCounter as jest.Mock).mockReturnValue(counter.promise);
    (playAtmBeep as jest.Mock).mockReturnValue(beep.promise);

    const pending = announceBalance(params());
    await jest.advanceTimersByTimeAsync(5000);
    expect(playAtmBeep).not.toHaveBeenCalled();

    counter.release();
    await jest.advanceTimersByTimeAsync(COUNTER_TO_BEEP_MS - 1);
    expect(playAtmBeep).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    expect(playAtmBeep).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(5000);
    expect(events.some((event) => event.startsWith('speak'))).toBe(false);

    beep.release();
    await jest.advanceTimersByTimeAsync(BEEP_TO_VOICE_MS - 1);
    expect(events.some((event) => event.startsWith('speak'))).toBe(false);
    await jest.advanceTimersByTimeAsync(1);
    await pending;
    expect(events.at(-1)).toBe('speak announce:1 dollar:en');
  });

  it('still plays the rest of the sequence when a sound fails', async () => {
    setVoiceProvider(makeProvider(events));
    (playCashCounter as jest.Mock).mockRejectedValue(new Error('no audio'));
    (playAtmBeep as jest.Mock).mockRejectedValue(new Error('no audio'));

    const pending = announceBalance(params());
    await jest.advanceTimersByTimeAsync(COUNTER_TO_BEEP_MS + BEEP_TO_VOICE_MS);
    await pending;

    expect(events).toEqual(['stop', 'speak announce:1 dollar:en']);
  });

  it('stops the previous speech before the sequence', async () => {
    const provider = makeProvider(events);
    setVoiceProvider(provider);

    const pending = announceBalance(params());
    await jest.advanceTimersByTimeAsync(COUNTER_TO_BEEP_MS + BEEP_TO_VOICE_MS);
    await pending;

    const stopOrder = (provider.stop as jest.Mock).mock.invocationCallOrder[0];
    const counterOrder = (playCashCounter as jest.Mock).mock.invocationCallOrder[0];
    expect(stopOrder).toBeLessThan(counterOrder as number);
  });

  describe('stopping', () => {
    it('during the counter: nothing else starts', async () => {
      setVoiceProvider(makeProvider(events));
      const counter = deferred();
      (playCashCounter as jest.Mock).mockReturnValue(counter.promise);
      const pending = announceBalance(params());
      await settle();
      await stopAnnouncement();
      counter.release();
      await jest.advanceTimersByTimeAsync(5000);
      await pending;

      expect(stopBeep).toHaveBeenCalled();
      expect(playAtmBeep).not.toHaveBeenCalled();
      expect(events.some((event) => event.startsWith('speak'))).toBe(false);
      expect(jest.getTimerCount()).toBe(0);
    });

    it('during the silence after the counter: no beep, no voice', async () => {
      setVoiceProvider(makeProvider(events));
      const pending = announceBalance(params());
      await jest.advanceTimersByTimeAsync(COUNTER_TO_BEEP_MS / 2);
      await stopAnnouncement();
      await jest.advanceTimersByTimeAsync(5000);
      await pending;

      expect(playAtmBeep).not.toHaveBeenCalled();
      expect(events.some((event) => event.startsWith('speak'))).toBe(false);
      expect(jest.getTimerCount()).toBe(0);
    });

    it('during the beep: the voice never starts', async () => {
      setVoiceProvider(makeProvider(events));
      const beep = deferred();
      (playAtmBeep as jest.Mock).mockReturnValue(beep.promise);
      const pending = announceBalance(params());
      await jest.advanceTimersByTimeAsync(COUNTER_TO_BEEP_MS);
      expect(playAtmBeep).toHaveBeenCalledTimes(1);
      await stopAnnouncement();
      beep.release();
      await jest.advanceTimersByTimeAsync(5000);
      await pending;

      expect(events.some((event) => event.startsWith('speak'))).toBe(false);
      expect(jest.getTimerCount()).toBe(0);
    });

    it('during the silence after the beep: the voice never starts', async () => {
      setVoiceProvider(makeProvider(events));
      const pending = announceBalance(params());
      await jest.advanceTimersByTimeAsync(COUNTER_TO_BEEP_MS + BEEP_TO_VOICE_MS / 2);
      expect(playAtmBeep).toHaveBeenCalledTimes(1);
      await stopAnnouncement();
      await jest.advanceTimersByTimeAsync(5000);
      await pending;

      expect(events.some((event) => event.startsWith('speak'))).toBe(false);
      expect(jest.getTimerCount()).toBe(0);
      expect(useAnnouncementState.getState().active).toBe(false);
    });

    it('interrupts the sound in progress even when idle', async () => {
      setVoiceProvider(makeProvider([]));
      await stopAnnouncement();
      expect(stopBeep).toHaveBeenCalledTimes(1);
    });

    it('without rejecting when the voice provider fails to stop', async () => {
      const provider = makeProvider([]);
      provider.stop = jest.fn(async () => {
        throw new Error('stop failed');
      });
      setVoiceProvider(provider);
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

      await expect(stopAnnouncement()).resolves.toBeUndefined();
      expect(stopBeep).toHaveBeenCalledTimes(1);
      expect(useAnnouncementState.getState().active).toBe(false);
      expect(warn).toHaveBeenCalledWith('Stopping the voice failed', expect.any(Error));
    });
  });

  it('announces once and goes inactive when the loop is off', async () => {
    setVoiceProvider(makeProvider([]));
    const pending = announceBalance(params());
    expect(useAnnouncementState.getState().active).toBe(true);
    await jest.advanceTimersByTimeAsync(SEQUENCE_MS);
    await pending;
    expect(playCashCounter).toHaveBeenCalledTimes(1);
    expect(playAtmBeep).toHaveBeenCalledTimes(1);
    expect(useAnnouncementState.getState().active).toBe(false);
  });

  it('settles without rejecting when a one-shot announcement fails', async () => {
    const provider = makeProvider([]);
    provider.speak = jest.fn(async () => {
      throw new Error('no voice');
    });
    setVoiceProvider(provider);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    const pending = announceBalance(params());
    await jest.advanceTimersByTimeAsync(SEQUENCE_MS);
    await expect(pending).resolves.toBeUndefined();
    expect(useAnnouncementState.getState().active).toBe(false);
    warn.mockRestore();
  });

  describe('loop', () => {
    let balance: number;
    let appStateHandler: (state: string) => void;
    const removeAppState = jest.fn();

    const start = () =>
      announceBalance({
        read: () => ({ amountMinor: balance, currency: 'USD', language: 'en' }),
        t,
        loop: true,
      });
    // One full cycle: both silences, the sounds and the voice being instant.
    const cycle = () => jest.advanceTimersByTimeAsync(SEQUENCE_MS);

    beforeEach(() => {
      balance = 100;
      setVoiceProvider(makeProvider(events));
      jest.spyOn(AppState, 'addEventListener').mockImplementation(((
        _type: string,
        handler: (state: string) => void,
      ) => {
        appStateHandler = handler;
        return { remove: removeAppState };
      }) as never);
    });

    afterEach(() => removeAppState.mockClear());

    it('replays the whole sequence at every cycle, with the balance read again each time', async () => {
      void start();
      await cycle();
      expect(events).toEqual(['stop', 'counter', 'beep', 'speak announce:1 dollar:en']);
      expect(useAnnouncementState.getState().active).toBe(true);

      // Still inside the pause: nothing new yet.
      await jest.advanceTimersByTimeAsync(LOOP_PAUSE_MS - 1);
      expect(playCashCounter).toHaveBeenCalledTimes(1);

      balance = 250;
      await jest.advanceTimersByTimeAsync(1);
      await cycle();
      expect(events.slice(4)).toEqual([
        'stop',
        'counter',
        'beep',
        'speak announce:2 dollars and 50 cents:en',
      ]);
      expect(useAnnouncementState.getState().active).toBe(true);
    });

    it('stops during the pause without starting another cycle', async () => {
      void start();
      await cycle();
      await jest.advanceTimersByTimeAsync(500);
      await stopAnnouncement();
      await jest.advanceTimersByTimeAsync(LOOP_PAUSE_MS * 3);
      expect(playCashCounter).toHaveBeenCalledTimes(1);
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
      await cycle();
      expect(provider.speak).toHaveBeenCalledTimes(1);
      await stopAnnouncement();
      await pending;
      expect(jest.getTimerCount()).toBe(0);
      await jest.advanceTimersByTimeAsync(LOOP_PAUSE_MS * 2);
      expect(provider.speak).toHaveBeenCalledTimes(1);
      expect(useAnnouncementState.getState().active).toBe(false);
    });

    it('stops during the counter of the second cycle', async () => {
      void start();
      await cycle();
      await jest.advanceTimersByTimeAsync(LOOP_PAUSE_MS);
      const counter = deferred();
      (playCashCounter as jest.Mock).mockReturnValue(counter.promise);
      await jest.advanceTimersByTimeAsync(0);
      await stopAnnouncement();
      counter.release();
      await jest.advanceTimersByTimeAsync(LOOP_PAUSE_MS * 3);
      expect(playAtmBeep).toHaveBeenCalledTimes(1);
      expect(jest.getTimerCount()).toBe(0);
    });

    it('does not stack cycles when started again while looping', async () => {
      void start();
      await cycle();
      void start();
      await cycle();
      await jest.advanceTimersByTimeAsync(LOOP_PAUSE_MS);
      await cycle();
      // Two starts played one cycle each, then only the second loop continued.
      expect(playCashCounter).toHaveBeenCalledTimes(3);
      await jest.advanceTimersByTimeAsync(LOOP_PAUSE_MS);
      await cycle();
      expect(playCashCounter).toHaveBeenCalledTimes(4);
    });

    it('reads the loop setting before every cycle and ends when it turns off', async () => {
      let repeat = true;
      void announceBalance({
        read: () => ({ amountMinor: balance, currency: 'USD', language: 'en' }),
        t,
        loop: () => repeat,
      });
      await cycle();
      await jest.advanceTimersByTimeAsync(LOOP_PAUSE_MS);
      await cycle();
      expect(playCashCounter).toHaveBeenCalledTimes(2);

      // Turned off during the pause: no new cycle once the pause ends.
      await jest.advanceTimersByTimeAsync(LOOP_PAUSE_MS / 2);
      repeat = false;
      await jest.advanceTimersByTimeAsync(LOOP_PAUSE_MS * 3);
      expect(playCashCounter).toHaveBeenCalledTimes(2);
      expect(useAnnouncementState.getState().active).toBe(false);
      expect(jest.getTimerCount()).toBe(0);
    });

    it('ends the loop when the voice provider fails', async () => {
      const provider = makeProvider(events);
      provider.speak = jest.fn(async () => {
        throw new Error('no voice');
      });
      setVoiceProvider(provider);
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const pending = start();
      await cycle();
      await pending;
      expect(warn).toHaveBeenCalledWith('Balance announcement failed', expect.any(Error));
      expect(useAnnouncementState.getState().active).toBe(false);
      await jest.advanceTimersByTimeAsync(LOOP_PAUSE_MS * 2);
      expect(provider.speak).toHaveBeenCalledTimes(1);
      expect(removeAppState).toHaveBeenCalled();
    });

    it('stops when the app goes to the background but not when it becomes inactive', async () => {
      void start();
      await cycle();
      appStateHandler('inactive');
      appStateHandler('active');
      expect(useAnnouncementState.getState().active).toBe(true);

      appStateHandler('background');
      await settle();
      expect(useAnnouncementState.getState().active).toBe(false);
      expect(stopBeep).toHaveBeenCalled();
      await jest.advanceTimersByTimeAsync(LOOP_PAUSE_MS * 2);
      expect(playCashCounter).toHaveBeenCalledTimes(1);
      expect(removeAppState).toHaveBeenCalled();
    });
  });
});
