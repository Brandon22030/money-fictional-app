/**
 * MFA-008 edge cases: audio session options, players released (no leak), and stop/restart
 * flows (stop during the voice, stop during the loop pause, then relaunch).
 */
import * as Speech from 'expo-speech';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import { announceBalance, setVoiceProvider, stopAnnouncement } from '@/src/services/voice';
import { LOOP_PAUSE_MS } from '@/src/services/voice/tellerAnnouncer';

type Options = { onDone?: () => void; onStopped?: () => void };
type Player = {
  options?: { keepAudioSessionActive?: boolean };
  remove: jest.Mock;
  pause: jest.Mock;
};

jest.mock('expo-speech', () => ({
  VoiceQuality: { Default: 'Default', Enhanced: 'Enhanced' },
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn(async () => false),
  getAvailableVoicesAsync: jest.fn(),
}));

let players: Player[] = [];
let pending: { options: Options; timer: ReturnType<typeof setTimeout> }[] = [];

const params = {
  read: () => ({
    amountMinor: 100,
    currency: 'EUR' as const,
    language: 'fr' as const,
  }),
  t: () => 'solde',
};

describe('voice audio session edge cases (MFA-008)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    players = [];
    pending = [];
    setVoiceProvider(null);
    (Speech.getAvailableVoicesAsync as jest.Mock).mockResolvedValue([
      { identifier: 'a', name: 'A', language: 'fr-CA', quality: 'Default' },
    ]);
    (Speech.speak as jest.Mock).mockImplementation((_t: string, options: Options) => {
      const entry = {
        options,
        timer: setTimeout(() => {
          pending = pending.filter((p) => p !== entry);
          options.onDone?.();
        }, 1500),
      };
      pending.push(entry);
    });
    (Speech.stop as jest.Mock).mockImplementation(async () => {
      const stopped = pending;
      pending = [];
      stopped.forEach(({ options, timer }) => {
        clearTimeout(timer);
        options.onStopped?.();
      });
    });
    (createAudioPlayer as jest.Mock).mockImplementation(
      (_s: number, options?: { keepAudioSessionActive?: boolean }) => {
        const listeners: ((s: { didJustFinish: boolean }) => void)[] = [];
        const player = {
          options,
          remove: jest.fn(),
          pause: jest.fn(),
          play: jest.fn(() => {
            setTimeout(() => listeners.forEach((l) => l({ didJustFinish: true })), 300);
          }),
          addListener: jest.fn((_e: string, l: (s: { didJustFinish: boolean }) => void) => {
            listeners.push(l);
            return { remove: jest.fn() };
          }),
        };
        players.push(player);
        return player;
      },
    );
  });

  afterEach(async () => {
    await stopAnnouncement();
    setVoiceProvider(null);
    jest.useRealTimers();
  });

  it('creates both the counter and the beep players with keepAudioSessionActive, in a mixing mode', async () => {
    const done = announceBalance(params);
    await jest.advanceTimersByTimeAsync(5000);
    await done;

    expect(players).toHaveLength(2);
    expect(players.every((p) => p.options?.keepAudioSessionActive === true)).toBe(true);
    expect(setAudioModeAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        playsInSilentMode: true,
        interruptionMode: 'mixWithOthers',
      }),
    );
  });

  it('releases every player of every loop cycle (no leak)', async () => {
    const done = announceBalance({
      ...params,
      loop: () => (Speech.speak as jest.Mock).mock.calls.length < 3,
    });
    await jest.advanceTimersByTimeAsync(30000);
    await done;

    expect(players).toHaveLength(6);
    players.forEach((p) => expect(p.remove).toHaveBeenCalledTimes(1));
  });

  it('a loop stopped in the middle of the voice ends, leaks no player and can be relaunched', async () => {
    const loop = announceBalance({ ...params, loop: true });
    // counter 300 + 150 + beep 300 + 250 = 1000 ms, then the voice speaks.
    await jest.advanceTimersByTimeAsync(1200);
    expect(Speech.speak).toHaveBeenCalledTimes(1);
    await stopAnnouncement();
    await loop;
    expect(pending).toHaveLength(0);
    players.forEach((p) => expect(p.remove).toHaveBeenCalledTimes(1));

    await jest.advanceTimersByTimeAsync(LOOP_PAUSE_MS * 3);
    expect(Speech.speak).toHaveBeenCalledTimes(1);
    expect(players).toHaveLength(2);

    const again = announceBalance(params);
    await jest.advanceTimersByTimeAsync(5000);
    await again;
    expect(Speech.speak).toHaveBeenCalledTimes(2);
    expect(players).toHaveLength(4);
    expect(players.slice(2).every((p) => p.options?.keepAudioSessionActive === true)).toBe(true);
    players.forEach((p) => expect(p.remove).toHaveBeenCalledTimes(1));
  });

  it('a stop during the loop pause starts nothing new', async () => {
    const loop = announceBalance({ ...params, loop: true });
    await jest.advanceTimersByTimeAsync(1000 + 1500 + 500);
    expect(Speech.speak).toHaveBeenCalledTimes(1);
    await stopAnnouncement();
    await loop;
    await jest.advanceTimersByTimeAsync(LOOP_PAUSE_MS * 3);
    expect(players).toHaveLength(2);
    expect(Speech.speak).toHaveBeenCalledTimes(1);
  });

  it('a stop during the counter releases its player and plays neither beep nor voice', async () => {
    const done = announceBalance(params);
    await jest.advanceTimersByTimeAsync(100);
    await stopAnnouncement();
    await done;
    await jest.advanceTimersByTimeAsync(5000);

    expect(players).toHaveLength(1);
    expect(players[0].pause).toHaveBeenCalledTimes(1);
    expect(players[0].remove).toHaveBeenCalledTimes(1);
    expect(Speech.speak).not.toHaveBeenCalled();
  });
});
