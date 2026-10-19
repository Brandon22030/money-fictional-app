import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { AppState } from 'react-native';

import i18n from '@/src/i18n';
import { setVoiceProvider, stopAnnouncement, LOOP_PAUSE_MS } from '@/src/services/voice';
import { useAnnouncementState } from '@/src/services/voice/announcementState';
import { useAppStore } from '@/src/store/useAppStore';

const APP_DIR = join(__dirname, '..', '..', 'app');
const ROOT = join(__dirname, '..', '..');

function makeProvider() {
  const speak = jest.fn(async (_text: string, _opts?: unknown) => undefined);
  const stop = jest.fn(async () => undefined);
  setVoiceProvider({ speak, stop, isSpeaking: jest.fn(async () => false) });
  return { speak, stop };
}

async function boot(repeat: boolean, balanceMajor = 1000) {
  await act(async () => {
    useAppStore.getState().resetAll();
    useAppStore.getState().setLanguage('fr');
    useAppStore.getState().setCurrency('EUR');
    useAppStore.getState().setBalance(balanceMajor * 100);
    useAppStore.getState().setRepeatAnnouncement(repeat);
    await i18n.changeLanguage('fr');
  });
  await renderRouter(APP_DIR);
  await screen.findByTestId('screen-home');
}

const elapse = (ms: number) =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
const spokenAt = (speak: jest.Mock, i: number) => String(speak.mock.calls[i]?.[0]);

describe('MFA-006 QA: cash counter loop', () => {
  jest.setTimeout(30000);

  afterEach(async () => {
    await act(async () => {
      await stopAnnouncement();
    });
    setVoiceProvider(null);
  });

  it('loops from Home, follows to Card, re-reads the balance, stops from Card', async () => {
    const { speak } = makeProvider();
    await boot(false, 1000);

    // Enable through the real Settings switch.
    await fireEvent.press(screen.getByTestId('tab-settings'));
    await screen.findByTestId('screen-settings');
    expect(useAppStore.getState().repeatAnnouncement).toBe(false);
    await fireEvent.press(screen.getByTestId('settings-repeat'));
    expect(useAppStore.getState().repeatAnnouncement).toBe(true);
    await fireEvent.press(screen.getByTestId('tab-index'));
    await screen.findByTestId('screen-home');

    await fireEvent.press(screen.getByTestId('home-voice'));
    await waitFor(() => expect(speak).toHaveBeenCalledTimes(1));
    expect(spokenAt(speak, 0)).toMatch(/1000 euros/);
    expect(screen.getByTestId('home-voice').props.accessibilityLabel).toBe('Arrêter');

    await fireEvent.press(screen.getByTestId('tab-card'));
    await screen.findByTestId('screen-card');
    expect(screen.getByTestId('action-listen').props.accessibilityLabel).toBe('Arrêter');

    // Balance changes between two cycles.
    await act(async () => {
      useAppStore.getState().setBalance(77700);
    });
    await waitFor(() => expect(speak).toHaveBeenCalledTimes(2), { timeout: LOOP_PAUSE_MS + 3000 });
    expect(spokenAt(speak, 1)).toMatch(/777 euros/);
    expect(spokenAt(speak, 1)).not.toMatch(/1000 euros/);

    await fireEvent.press(screen.getByTestId('action-listen'));
    expect(useAnnouncementState.getState().active).toBe(false);
    expect(screen.getByTestId('action-listen').props.accessibilityLabel).toBe('Écouter');
    const count = speak.mock.calls.length;
    await elapse(LOOP_PAUSE_MS * 3);
    expect(speak).toHaveBeenCalledTimes(count);
  });

  it('announces only once when the switch is off', async () => {
    const { speak } = makeProvider();
    await boot(false);
    await fireEvent.press(screen.getByTestId('home-voice'));
    await waitFor(() => expect(speak).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(useAnnouncementState.getState().active).toBe(false));
    await elapse(LOOP_PAUSE_MS * 3);
    expect(speak).toHaveBeenCalledTimes(1);
  });

  it('ends the loop after the current cycle when the switch is turned off', async () => {
    const { speak } = makeProvider();
    await boot(true);
    await fireEvent.press(screen.getByTestId('home-voice'));
    await waitFor(() => expect(speak).toHaveBeenCalledTimes(1));
    await act(async () => {
      useAppStore.getState().setRepeatAnnouncement(false);
    });
    await elapse(LOOP_PAUSE_MS * 3);
    expect(speak).toHaveBeenCalledTimes(1);
    expect(useAnnouncementState.getState().active).toBe(false);
  });

  it('ends the loop after a reset of the app', async () => {
    const { speak } = makeProvider();
    await boot(true);
    await fireEvent.press(screen.getByTestId('home-voice'));
    await waitFor(() => expect(speak).toHaveBeenCalledTimes(1));
    await act(async () => {
      useAppStore.getState().resetAll();
    });
    expect(useAppStore.getState().repeatAnnouncement).toBe(false);
    await elapse(LOOP_PAUSE_MS * 3);
    expect(speak).toHaveBeenCalledTimes(1);
    expect(useAnnouncementState.getState().active).toBe(false);
  });

  it('ends the loop when the voice provider fails', async () => {
    const speak = jest.fn(async () => {
      throw new Error('tts down');
    });
    setVoiceProvider({ speak, stop: jest.fn(async () => undefined), isSpeaking: jest.fn(async () => false) });
    await boot(true);
    await fireEvent.press(screen.getByTestId('home-voice'));
    await waitFor(() => expect(useAnnouncementState.getState().active).toBe(false));
    await elapse(LOOP_PAUSE_MS * 3);
    expect(speak).toHaveBeenCalledTimes(1);
  });

  it('stops the loop when the app goes to the background', async () => {
    const { speak } = makeProvider();
    let listener: ((s: string) => void) | undefined;
    const remove = jest.fn();
    const spy = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation(((_: string, cb: (s: string) => void) => {
        listener = cb;
        return { remove };
      }) as never);
    try {
      await boot(true);
      await fireEvent.press(screen.getByTestId('home-voice'));
      await waitFor(() => expect(speak).toHaveBeenCalledTimes(1));
      expect(useAnnouncementState.getState().active).toBe(true);
      await act(async () => {
        listener?.('background');
      });
      expect(useAnnouncementState.getState().active).toBe(false);
      expect(remove).toHaveBeenCalled();
      await elapse(LOOP_PAUSE_MS * 3);
      expect(speak).toHaveBeenCalledTimes(1);
    } finally {
      spy.mockRestore();
    }
  });
});

describe('MFA-006 QA: sound asset and credits', () => {
  it('ships the m4a, no teller beep leftovers, CC0 credit with URL', () => {
    expect(existsSync(join(ROOT, 'assets/sounds/cash-counter.m4a'))).toBe(true);
    expect(existsSync(join(ROOT, 'assets/sounds/teller-beep.wav'))).toBe(false);
    expect(existsSync(join(ROOT, 'scripts/generate-beep.mjs'))).toBe(false);
    const m4a = readFileSync(join(ROOT, 'assets/sounds/cash-counter.m4a'));
    expect(m4a.subarray(4, 8).toString('ascii')).toBe('ftyp');
    expect(m4a.length).toBeLessThan(60 * 1024);
    const credits = readFileSync(join(ROOT, 'assets/sounds/CREDITS.md'), 'utf8');
    expect(credits).toContain('https://freesound.org/people/madvedj/sounds/178097/');
    expect(credits).toMatch(/CC0/);
    const beep = readFileSync(join(ROOT, 'src/services/voice/beep.ts'), 'utf8');
    expect(beep).toContain('cash-counter.m4a');
    expect(beep).not.toMatch(/teller-beep/);
  });
});
