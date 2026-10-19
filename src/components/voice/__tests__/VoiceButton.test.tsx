import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { VoiceButton } from '@/src/components/voice/VoiceButton';
import i18n from '@/src/i18n';
import { useAppStore } from '@/src/store/useAppStore';
import {
  BEEP_TO_VOICE_MS,
  COUNTER_TO_BEEP_MS,
  LOOP_PAUSE_MS,
  setVoiceProvider,
  stopAnnouncement,
} from '@/src/services/voice';
import type { VoiceProvider } from '@/src/services/voice';

jest.mock('@/src/services/voice/beep', () => ({
  playCashCounter: jest.fn(async () => undefined),
  playAtmBeep: jest.fn(async () => undefined),
  stopBeep: jest.fn(),
}));

// The sounds are mocked (instant), so only the two silences of the sequence remain before the voice.
const SILENCES_MS = COUNTER_TO_BEEP_MS + BEEP_TO_VOICE_MS;

async function press(testID: string) {
  await fireEvent.press(screen.getByTestId(testID));
  await act(async () => {
    await jest.advanceTimersByTimeAsync(SILENCES_MS);
  });
}

describe('VoiceButton', () => {
  let finishSpeech: () => void = () => undefined;
  let provider: VoiceProvider;

  beforeEach(async () => {
    jest.useFakeTimers();
    await i18n.changeLanguage('fr');
    useAppStore.getState().resetAll();
    useAppStore.setState({
      balanceMinor: 125050,
      currency: 'EUR',
      language: 'fr',
    });
    provider = {
      speak: jest.fn(
        () =>
          new Promise<void>((resolve) => {
            finishSpeech = resolve;
          }),
      ),
      stop: jest.fn(async () => {
        finishSpeech();
      }),
      isSpeaking: jest.fn(async () => false),
    };
    setVoiceProvider(provider);
  });

  afterEach(async () => {
    await act(async () => {
      await stopAnnouncement();
    });
    setVoiceProvider(null);
    jest.useRealTimers();
  });

  it('announces on press and stops on a second press', async () => {
    await render(<VoiceButton testID="voice" />);

    await press('voice');
    expect(provider.speak).toHaveBeenCalledWith(
      'Votre solde bancaire actuel est de 1250 euros et 50 centimes',
      { language: 'fr' },
    );
    expect(screen.getByLabelText('Arrêter')).toBeTruthy();

    await press('voice');
    expect(provider.stop).toHaveBeenCalled();
    expect(screen.getByLabelText('Écouter')).toBeTruthy();
  });

  it('stops on a fast second press made before the button re-renders', async () => {
    // The synchronous RNTL press, so that both presses happen inside one act, before React
    // re-renders the button: they use the handler of the same render, as with a quick double tap.
    const { fireEvent: syncFireEvent } = jest.requireActual<
      typeof import('@testing-library/react-native')
    >('@testing-library/react-native');
    await render(<VoiceButton testID="voice" />);
    const button = screen.getByTestId('voice');
    await act(async () => {
      syncFireEvent.press(button);
      syncFireEvent.press(button);
    });
    expect(provider.stop).toHaveBeenCalled();
    expect(screen.getByLabelText('Écouter')).toBeTruthy();
  });

  it('renders the action variant by default and the tile variant on demand', async () => {
    const { rerender } = await render(<VoiceButton testID="voice" />);
    expect(screen.getByLabelText('Écouter')).toBeTruthy();
    await rerender(<VoiceButton testID="voice" variant="tile" />);
    expect(screen.getByLabelText('Écouter')).toBeTruthy();
  });

  it('returns to the listen state when the speech ends', async () => {
    useAppStore.setState({
      balanceMinor: 100,
      currency: 'USD',
      language: 'en',
    });
    await render(<VoiceButton testID="voice" variant="tile" />);
    await press('voice');
    expect(provider.speak).toHaveBeenCalledWith('Your current bank balance is 1 dollar', {
      language: 'en',
    });

    await act(async () => {
      finishSpeech();
    });
    expect(screen.getByTestId('voice')).toBeTruthy();
  });

  it('ignores the end of an older announcement after a stop and a new press', async () => {
    const pending: (() => void)[] = [];
    provider.speak = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          pending.push(resolve);
        }),
    );
    // A provider whose stop does not settle the pending speech right away.
    provider.stop = jest.fn(async () => undefined);

    await render(<VoiceButton testID="voice" />);
    await press('voice');
    expect(screen.getByLabelText('Arrêter')).toBeTruthy();
    await press('voice');
    expect(screen.getByLabelText('Écouter')).toBeTruthy();
    await press('voice');
    expect(screen.getByLabelText('Arrêter')).toBeTruthy();
    expect(pending).toHaveLength(2);

    await act(async () => {
      pending[0]?.();
    });
    expect(screen.getByLabelText('Arrêter')).toBeTruthy();

    await act(async () => {
      pending[1]?.();
    });
    expect(screen.getByLabelText('Écouter')).toBeTruthy();
  });

  it('keeps two buttons in sync and lets either one stop the announcement', async () => {
    await render(
      <>
        <VoiceButton testID="home" />
        <VoiceButton testID="card" variant="tile" />
      </>,
    );
    await press('home');
    expect(screen.getAllByLabelText('Arrêter')).toHaveLength(2);

    await press('card');
    expect(screen.getAllByLabelText('Écouter')).toHaveLength(2);
    expect(provider.stop).toHaveBeenCalled();
  });

  it('keeps announcing when the button unmounts, and a new one shows Stop', async () => {
    const first = await render(<VoiceButton testID="voice" />);
    await press('voice');
    await first.unmount();
    expect(provider.speak).toHaveBeenCalledTimes(1);

    await render(<VoiceButton testID="voice" />);
    expect(screen.getByLabelText('Arrêter')).toBeTruthy();
  });

  describe('with the repeat switch on', () => {
    beforeEach(() => {
      useAppStore.getState().setRepeatAnnouncement(true);
    });

    it('loops with the current balance until Stop is pressed', async () => {
      await render(<VoiceButton testID="voice" />);
      await press('voice');
      expect(provider.speak).toHaveBeenCalledTimes(1);

      await act(async () => {
        finishSpeech();
      });
      expect(screen.getByLabelText('Arrêter')).toBeTruthy();

      await act(async () => {
        useAppStore.getState().setBalance(300);
        await jest.advanceTimersByTimeAsync(LOOP_PAUSE_MS + SILENCES_MS);
      });
      expect(provider.speak).toHaveBeenCalledTimes(2);
      expect(provider.speak).toHaveBeenLastCalledWith(
        'Votre solde bancaire actuel est de 3 euros',
        { language: 'fr' },
      );

      await press('voice');
      expect(screen.getByLabelText('Écouter')).toBeTruthy();
      await act(async () => {
        await jest.advanceTimersByTimeAsync(LOOP_PAUSE_MS * 3);
      });
      expect(provider.speak).toHaveBeenCalledTimes(2);
    });

    it.each([
      ['the repeat switch is turned off', () => useAppStore.getState().setRepeatAnnouncement(false)],
      ['the app is reset', () => useAppStore.getState().resetAll()],
    ])('ends the loop when %s during the pause', async (_name, change) => {
      await render(<VoiceButton testID="voice" />);
      await press('voice');
      await act(async () => {
        finishSpeech();
      });
      expect(screen.getByLabelText('Arrêter')).toBeTruthy();

      await act(async () => {
        await jest.advanceTimersByTimeAsync(LOOP_PAUSE_MS / 2);
        change();
        await jest.advanceTimersByTimeAsync(LOOP_PAUSE_MS * 3);
      });
      expect(provider.speak).toHaveBeenCalledTimes(1);
      expect(screen.getByLabelText('Écouter')).toBeTruthy();
    });
  });
});
