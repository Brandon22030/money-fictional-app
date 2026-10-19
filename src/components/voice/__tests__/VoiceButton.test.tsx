import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { VoiceButton } from '@/src/components/voice/VoiceButton';
import i18n from '@/src/i18n';
import { setVoiceProvider } from '@/src/services/voice';
import type { VoiceProvider } from '@/src/services/voice';

jest.mock('@/src/services/voice/beep', () => ({
  playBeep: jest.fn(async () => undefined),
  stopBeep: jest.fn(),
}));

describe('VoiceButton', () => {
  let finishSpeech: () => void = () => undefined;
  let provider: VoiceProvider;

  beforeEach(async () => {
    await i18n.changeLanguage('fr');
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

  afterEach(() => setVoiceProvider(null));

  it('announces on press and stops on a second press', async () => {
    await render(<VoiceButton testID="voice" amountMinor={125050} currency="EUR" language="fr" />);
    const button = screen.getByTestId('voice');

    await fireEvent.press(button);
    expect(provider.speak).toHaveBeenCalledWith(
      'Votre solde bancaire actuel est de 1250 euros et 50 centimes',
      { language: 'fr' },
    );
    expect(screen.getByLabelText('Arrêter')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('voice'));
    expect(provider.stop).toHaveBeenCalled();
    expect(screen.getByLabelText('Écouter')).toBeTruthy();
  });

  it('renders the action variant by default and the tile variant on demand', async () => {
    const { rerender } = await render(
      <VoiceButton testID="voice" amountMinor={100} currency="EUR" language="fr" />,
    );
    expect(screen.getByLabelText('Écouter')).toBeTruthy();
    await rerender(
      <VoiceButton testID="voice" amountMinor={100} currency="EUR" language="fr" variant="tile" />,
    );
    expect(screen.getByLabelText('Écouter')).toBeTruthy();
  });

  it('returns to the listen state when the speech ends', async () => {
    await render(
      <VoiceButton testID="voice" amountMinor={100} currency="USD" language="en" variant="tile" />,
    );
    await fireEvent.press(screen.getByTestId('voice'));
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

    await render(<VoiceButton testID="voice" amountMinor={100} currency="EUR" language="fr" />);
    await fireEvent.press(screen.getByTestId('voice'));
    expect(screen.getByLabelText('Arrêter')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('voice'));
    expect(screen.getByLabelText('Écouter')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('voice'));
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
});
