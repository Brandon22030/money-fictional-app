import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createAudioPlayer } from 'expo-audio';

import { playAtmBeep, playCashCounter, stopBeep } from '@/src/services/voice/beep';

type Listener = (status: { didJustFinish: boolean }) => void;

function makePlayer() {
  const listeners: Listener[] = [];
  return {
    listeners,
    play: jest.fn(),
    pause: jest.fn(),
    remove: jest.fn(),
    addListener: jest.fn((_event: string, listener: Listener) => {
      listeners.push(listener);
      return { remove: jest.fn() };
    }),
  };
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('beep', () => {
  let player: ReturnType<typeof makePlayer>;

  beforeEach(() => {
    player = makePlayer();
    (createAudioPlayer as jest.Mock).mockClear().mockReturnValue(player);
  });

  it('resolves and releases the player when the beep finishes', async () => {
    const done = playCashCounter();
    await flush();
    expect(player.play).toHaveBeenCalled();
    player.listeners.forEach((listener) => listener({ didJustFinish: true }));
    await done;
    expect(player.remove).toHaveBeenCalledTimes(1);
  });

  it('stopBeep pauses, releases and settles the beep in progress', async () => {
    let settled = false;
    const done = playCashCounter().then(() => {
      settled = true;
    });
    await flush();
    expect(settled).toBe(false);

    stopBeep();
    await done;
    expect(settled).toBe(true);
    expect(player.pause).toHaveBeenCalledTimes(1);
    expect(player.remove).toHaveBeenCalledTimes(1);

    stopBeep();
    expect(player.pause).toHaveBeenCalledTimes(1);
  });

  it('does not start a beep stopped while the audio mode is being set', async () => {
    const done = playCashCounter();
    stopBeep();
    await done;
    expect(createAudioPlayer).not.toHaveBeenCalled();
  });

  it('rejects and cleans up when the player cannot play', async () => {
    player.play.mockImplementation(() => {
      throw new Error('no audio');
    });
    await expect(playCashCounter()).rejects.toThrow('no audio');
    expect(player.remove).toHaveBeenCalledTimes(1);
  });

  it('settles on its own after the safety timeout when the finish event never comes', async () => {
    jest.useFakeTimers();
    try {
      const done = playCashCounter();
      await jest.advanceTimersByTimeAsync(2999);
      expect(player.remove).not.toHaveBeenCalled();
      await jest.advanceTimersByTimeAsync(1);
      await done;
      expect(player.remove).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('plays the ATM beep with its own, shorter safety timeout', async () => {
    jest.useFakeTimers();
    try {
      const done = playAtmBeep();
      await jest.advanceTimersByTimeAsync(999);
      expect(player.play).toHaveBeenCalledTimes(1);
      expect(player.remove).not.toHaveBeenCalled();
      await jest.advanceTimersByTimeAsync(1);
      await done;
      expect(player.remove).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('ships the beep asset, its credit and its generation script', () => {
    const root = join(__dirname, '../../../..');
    const m4a = readFileSync(join(root, 'assets/sounds/atm-beep.m4a'));
    expect(m4a.subarray(4, 8).toString('ascii')).toBe('ftyp');
    expect(readFileSync(join(root, 'assets/sounds/CREDITS.md'), 'utf8')).toContain('atm-beep.m4a');
    expect(existsSync(join(root, 'scripts/generate-atm-beep.mjs'))).toBe(true);
    const source = readFileSync(join(__dirname, '../beep.ts'), 'utf8');
    expect(source).toContain('atm-beep.m4a');
    expect(source).toContain('cash-counter.m4a');
  });

  it('starting a sound interrupts the one in progress', async () => {
    const first = playCashCounter();
    await flush();
    const second = playAtmBeep();
    await first;
    expect(player.pause).toHaveBeenCalledTimes(1);
    await flush();
    stopBeep();
    await second;
  });
});
