import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import * as Speech from 'expo-speech';
import { execFileSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

import i18n from '@/src/i18n';
import * as beep from '@/src/services/voice/beep';
import {
  BEEP_TO_VOICE_MS,
  COUNTER_TO_BEEP_MS,
  LOOP_PAUSE_MS,
  setVoiceProvider,
  stopAnnouncement,
} from '@/src/services/voice';
import { ExpoSpeechVoiceProvider } from '@/src/services/voice/ExpoSpeechVoiceProvider';
import { useAnnouncementState } from '@/src/services/voice/announcementState';
import { useAppStore } from '@/src/store/useAppStore';

jest.mock('expo-speech', () => ({
  VoiceQuality: { Default: 'Default', Enhanced: 'Enhanced' },
  speak: jest.fn(),
  stop: jest.fn(async () => undefined),
  isSpeakingAsync: jest.fn(async () => false),
  getAvailableVoicesAsync: jest.fn(async () => []),
}));
jest.mock('@/src/services/voice/beep', () => ({
  playCashCounter: jest.fn(),
  playAtmBeep: jest.fn(),
  stopBeep: jest.fn(),
}));

const APP_DIR = join(__dirname, '..', '..', 'app');
const ROOT = join(__dirname, '..', '..');

const counter = beep.playCashCounter as jest.Mock;
const atm = beep.playAtmBeep as jest.Mock;
const speechSpeak = Speech.speak as jest.Mock;
const log: string[] = [];

const AMELIE = {
  identifier: 'com.apple.voice.compact.fr-CA.Amelie',
  name: 'Amélie',
  language: 'fr-CA',
  quality: 'Default',
};
const THOMAS = {
  identifier: 'com.apple.voice.compact.fr-FR.Thomas',
  name: 'Thomas',
  language: 'fr-FR',
  quality: 'Default',
};

const elapse = (ms: number) =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });

async function boot(language: 'fr' | 'en', repeat = false) {
  await act(async () => {
    useAppStore.getState().resetAll();
    useAppStore.getState().setLanguage(language);
    useAppStore.getState().setCurrency('EUR');
    useAppStore.getState().setBalance(100000);
    useAppStore.getState().setRepeatAnnouncement(repeat);
    await i18n.changeLanguage(language);
  });
  await renderRouter(APP_DIR);
  await screen.findByTestId('screen-home');
}

describe('MFA-007 QA: counter -> beep -> voice from Home', () => {
  jest.setTimeout(30000);
  let counterResolve: (() => void) | undefined;
  let beepResolve: (() => void) | undefined;

  beforeEach(() => {
    log.length = 0;
    jest.clearAllMocks();
    counterResolve = undefined;
    beepResolve = undefined;
    counter.mockImplementation(() => {
      log.push('counter');
      return Promise.resolve();
    });
    atm.mockImplementation(() => {
      log.push('beep');
      return Promise.resolve();
    });
    speechSpeak.mockImplementation((_t: string, o: { onDone?: () => void }) => {
      log.push('voice');
      o.onDone?.();
    });
    (Speech.getAvailableVoicesAsync as jest.Mock).mockResolvedValue([THOMAS, AMELIE]);
    setVoiceProvider(new ExpoSpeechVoiceProvider());
  });

  afterEach(async () => {
    await act(async () => {
      await stopAnnouncement();
    });
    setVoiceProvider(null);
  });

  it('plays counter, then beep, then the voice, with Amelie fr-CA in French', async () => {
    await boot('fr');
    await fireEvent.press(screen.getByTestId('home-voice'));
    await elapse(0);
    expect(log).toEqual(['counter']);
    await elapse(COUNTER_TO_BEEP_MS - 1);
    expect(log).toEqual(['counter']);
    await elapse(1);
    expect(log).toEqual(['counter', 'beep']);
    await elapse(BEEP_TO_VOICE_MS - 1);
    expect(log).toEqual(['counter', 'beep']);
    await elapse(1);
    expect(log).toEqual(['counter', 'beep', 'voice']);
    const [text, opts] = speechSpeak.mock.calls[0];
    expect(text).toMatch(/1000 euros/);
    expect(opts.voice).toBe(AMELIE.identifier);
    expect(opts.language).toBe('fr-CA');
  });

  it('imposes no French voice in English', async () => {
    await boot('en');
    await fireEvent.press(screen.getByTestId('home-voice'));
    await elapse(COUNTER_TO_BEEP_MS + BEEP_TO_VOICE_MS + 10);
    expect(log).toEqual(['counter', 'beep', 'voice']);
    const opts = speechSpeak.mock.calls[0][1];
    expect(opts.voice).toBeUndefined();
    expect(opts.language).toMatch(/^en/);
    expect(Speech.getAvailableVoicesAsync).not.toHaveBeenCalled();
  });

  it('falls back to the system fr-FR voice when no female voice is available', async () => {
    (Speech.getAvailableVoicesAsync as jest.Mock).mockResolvedValue([THOMAS]);
    await boot('fr');
    await fireEvent.press(screen.getByTestId('home-voice'));
    await elapse(COUNTER_TO_BEEP_MS + BEEP_TO_VOICE_MS + 10);
    const opts = speechSpeak.mock.calls[0][1];
    expect(opts.voice).toBeUndefined();
    expect(opts.language).toBe('fr-FR');
  });

  it('Stop during the beep never starts the voice', async () => {
    atm.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          log.push('beep');
          beepResolve = resolve;
        }),
    );
    await boot('fr');
    await fireEvent.press(screen.getByTestId('home-voice'));
    await elapse(COUNTER_TO_BEEP_MS + 10);
    expect(log).toEqual(['counter', 'beep']);
    expect(screen.getByTestId('home-voice').props.accessibilityLabel).toBe('Arrêter');

    await fireEvent.press(screen.getByTestId('home-voice'));
    expect(beep.stopBeep).toHaveBeenCalled();
    expect(useAnnouncementState.getState().active).toBe(false);
    // The beep promise settles late (as when the player is released): still no voice.
    await act(async () => {
      beepResolve?.();
    });
    await elapse(BEEP_TO_VOICE_MS * 4 + LOOP_PAUSE_MS * 2);
    expect(speechSpeak).not.toHaveBeenCalled();
    expect(log).toEqual(['counter', 'beep']);
  });

  it('Stop during the counter ends everything', async () => {
    counter.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          log.push('counter');
          counterResolve = resolve;
        }),
    );
    await boot('fr');
    await fireEvent.press(screen.getByTestId('home-voice'));
    await elapse(10);
    await fireEvent.press(screen.getByTestId('home-voice'));
    await act(async () => {
      counterResolve?.();
    });
    await elapse(5000);
    expect(log).toEqual(['counter']);
    expect(speechSpeak).not.toHaveBeenCalled();
  });

  it('loop on: the whole sequence replays, until stopped', async () => {
    await boot('fr', true);
    await fireEvent.press(screen.getByTestId('home-voice'));
    await elapse(COUNTER_TO_BEEP_MS + BEEP_TO_VOICE_MS + 10);
    expect(log).toEqual(['counter', 'beep', 'voice']);
    await elapse(LOOP_PAUSE_MS + COUNTER_TO_BEEP_MS + BEEP_TO_VOICE_MS + 50);
    expect(log).toEqual(['counter', 'beep', 'voice', 'counter', 'beep', 'voice']);
    expect(speechSpeak.mock.calls[1][1].voice).toBe(AMELIE.identifier);
    // Voice list is cached across cycles.
    expect(Speech.getAvailableVoicesAsync).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByTestId('home-voice'));
    const n = log.length;
    await elapse(LOOP_PAUSE_MS * 3);
    expect(log.length).toBe(n);
  });

  it('keeps going to the voice when the sounds fail', async () => {
    counter.mockRejectedValue(new Error('no audio'));
    atm.mockRejectedValue(new Error('no audio'));
    await boot('fr');
    await fireEvent.press(screen.getByTestId('home-voice'));
    await elapse(COUNTER_TO_BEEP_MS + BEEP_TO_VOICE_MS + 10);
    await waitFor(() => expect(speechSpeak).toHaveBeenCalledTimes(1));
  });
});

describe('MFA-007 QA: beep asset, credits, generator', () => {
  it('ships a valid m4a within the budget and credits it as an original creation', () => {
    const file = join(ROOT, 'assets/sounds/atm-beep.m4a');
    expect(existsSync(file)).toBe(true);
    const m4a = readFileSync(file);
    expect(m4a.subarray(4, 8).toString('ascii')).toBe('ftyp');
    expect(m4a.length).toBeLessThan(20 * 1024);
    expect(existsSync(join(ROOT, 'assets/sounds/cash-counter.m4a'))).toBe(true);
    const credits = readFileSync(join(ROOT, 'assets/sounds/CREDITS.md'), 'utf8');
    const section = credits.split('## atm-beep.m4a')[1] ?? '';
    expect(section).toMatch(/original creation of this project/i);
    expect(section).toMatch(/no third-party material/i);
    expect(section).toContain('scripts/generate-atm-beep.mjs');
    expect(section).not.toMatch(/freesound|CC0|CC BY/i);
  });

  it('has a deterministic generator: no randomness, no clock, wired to the same output', () => {
    const src = readFileSync(join(ROOT, 'scripts/generate-atm-beep.mjs'), 'utf8');
    expect(src).not.toMatch(/Math\.random|Date\.now|new Date|randomBytes|randomUUID|performance\.now/);
    expect(src).toContain('assets/sounds/atm-beep.m4a');
    // The synthesized PCM is a pure function of constants: run only the synthesis twice.
    const synth = src.slice(src.indexOf('const SR'), src.indexOf('const root')) +
      src.slice(src.indexOf('// Fundamental'), src.indexOf('// 44.1 kHz'));
    const run = () =>
      execFileSync(
        process.execPath,
        ['-e', `${synth}\nconsole.log(JSON.stringify(Array.from(synthesize())))`],
        { maxBuffer: 64 * 1024 * 1024, encoding: 'utf8' },
      );
    const a = run();
    expect(a.length).toBeGreaterThan(1000);
    expect(run()).toBe(a);
  });
});
