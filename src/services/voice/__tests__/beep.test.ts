import { createAudioPlayer } from 'expo-audio';

import { playBeep, stopBeep } from '@/src/services/voice/beep';

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
    const done = playBeep();
    await flush();
    expect(player.play).toHaveBeenCalled();
    player.listeners.forEach((listener) => listener({ didJustFinish: true }));
    await done;
    expect(player.remove).toHaveBeenCalledTimes(1);
  });

  it('stopBeep pauses, releases and settles the beep in progress', async () => {
    let settled = false;
    const done = playBeep().then(() => {
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
    const done = playBeep();
    stopBeep();
    await done;
    expect(createAudioPlayer).not.toHaveBeenCalled();
  });

  it('rejects and cleans up when the player cannot play', async () => {
    player.play.mockImplementation(() => {
      throw new Error('no audio');
    });
    await expect(playBeep()).rejects.toThrow('no audio');
    expect(player.remove).toHaveBeenCalledTimes(1);
  });

  it('settles on its own after the safety timeout when the finish event never comes', async () => {
    jest.useFakeTimers();
    try {
      const done = playBeep();
      await jest.advanceTimersByTimeAsync(2999);
      expect(player.remove).not.toHaveBeenCalled();
      await jest.advanceTimersByTimeAsync(1);
      await done;
      expect(player.remove).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });
});
