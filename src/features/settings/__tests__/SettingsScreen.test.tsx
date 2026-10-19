import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import i18n from '@/src/i18n';
import { useLanguageSync } from '@/src/i18n/useLanguageSync';
import { useAppStore } from '@/src/store/useAppStore';

import { SettingsScreen } from '../SettingsScreen';

beforeEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('fr');
  });
  useAppStore.getState().resetAll();
  useAppStore.setState({ language: 'fr' });
});

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

/** Stands in for the root layout, the only place that syncs i18next with the store. */
function LanguageSync() {
  useLanguageSync();
  return null;
}

function renderScreen(withSync = true) {
  return render(
    <SafeAreaProvider initialMetrics={METRICS}>
      {withSync ? <LanguageSync /> : null}
      <SettingsScreen />
    </SafeAreaProvider>,
  );
}

describe('SettingsScreen', () => {
  it('translates the screen when the language changes and persists it in the store', async () => {
    await renderScreen();
    expect(screen.getByText('Devise')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('settings-language-en'));

    expect(await screen.findByText('Currency')).toBeTruthy();
    expect(useAppStore.getState().language).toBe('en');
  });

  it('only updates the store: changing i18next is left to the root sync', async () => {
    await renderScreen(false);
    await fireEvent.press(screen.getByTestId('settings-language-en'));
    expect(useAppStore.getState().language).toBe('en');
    expect(i18n.language).toBe('fr');
  });

  it('updates the currency in the store', async () => {
    await renderScreen();
    await fireEvent.press(screen.getByTestId('settings-currency-USD'));
    expect(useAppStore.getState().currency).toBe('USD');
    await fireEvent.press(screen.getByTestId('settings-currency-XOF'));
    expect(useAppStore.getState().currency).toBe('XOF');
  });

  it('applies the holder name in uppercase, capped at 26 characters', async () => {
    await renderScreen();
    const input = screen.getByTestId('settings-holder');
    await fireEvent.changeText(input, 'ada lovelace');
    await fireEvent(input, 'blur');
    expect(useAppStore.getState().holderName).toBe('ADA LOVELACE');
    expect(input.props.maxLength).toBe(26);
  });

  it('resets only after confirmation', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    useAppStore.getState().setBalance(4242);
    await renderScreen();

    await fireEvent.press(screen.getByTestId('settings-reset'));
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(useAppStore.getState().balanceMinor).toBe(4242);

    const buttons = alertSpy.mock.calls[0]?.[2] ?? [];
    const confirm = buttons.find((button) => button.style === 'destructive');
    await act(async () => {
      confirm?.onPress?.();
    });
    expect(useAppStore.getState().balanceMinor).not.toBe(4242);
    alertSpy.mockRestore();
  });

  it('shows the about text and the app version', async () => {
    await renderScreen();
    expect(screen.getByText(/Solde et carte fictifs/)).toBeTruthy();
    expect(screen.getByTestId('settings-version')).toHaveTextContent(/Version \d/);
  });
});
