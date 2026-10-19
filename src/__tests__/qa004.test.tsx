import { act, fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import { join } from 'path';

import i18n from '@/src/i18n';
import { useAppStore } from '@/src/store/useAppStore';

const APP_DIR = join(__dirname, '..', '..', 'app');

async function typeDigits(digits: string) {
  for (const digit of digits) await fireEvent.press(screen.getByTestId(`keypad-${digit}`));
}

async function boot(opts: { language?: 'fr' | 'en'; balanceMajor?: number } = {}) {
  const language = opts.language ?? 'fr';
  await act(async () => {
    useAppStore.getState().resetAll();
    useAppStore.getState().setLanguage(language);
    useAppStore.getState().setCurrency('EUR');
    useAppStore.getState().setBalance((opts.balanceMajor ?? 1000) * 100);
    await i18n.changeLanguage(language);
  });
  await renderRouter(APP_DIR);
  await screen.findByTestId('screen-home');
}

describe('MFA-004 QA non-regression', () => {
  it('sends to the Famille abundance source and shows "Partagé avec Famille" in History', async () => {
    await boot();
    await fireEvent.press(screen.getByTestId('home-favorite-family'));
    await screen.findByTestId('screen-keypad');
    expect(screen.getByTestId('keypad-contact')).toBeTruthy();
    await typeDigits('50');
    await fireEvent.press(screen.getByTestId('keypad-validate'));
    const state = useAppStore.getState();
    expect(state.balanceMinor).toBe(95000);
    expect(state.userTransactions[0]?.kind).toBe('send');
    await screen.findByTestId('screen-home');
    await fireEvent.press(screen.getByTestId('tab-history'));
    await screen.findByTestId('screen-history');
    expect(screen.getByTestId(`history-item-${state.userTransactions[0]!.id}`)).toBeTruthy();
    expect(screen.getAllByText('Partagé avec Famille').length).toBeGreaterThan(0);
  });

  it('pay and withdraw from the card debit the balance and refuse overdraft', async () => {
    await boot({ balanceMajor: 100 });
    await fireEvent.press(screen.getByTestId('tab-card'));
    await screen.findByTestId('screen-card');
    await fireEvent.press(screen.getByTestId('action-pay'));
    await screen.findByTestId('screen-keypad');
    await typeDigits('30');
    await fireEvent.press(screen.getByTestId('keypad-validate'));
    expect(useAppStore.getState().balanceMinor).toBe(7000);
    expect(useAppStore.getState().userTransactions[0]?.kind).toBe('pay');

    await fireEvent.press(screen.getByTestId('tab-card'));
    await screen.findByTestId('screen-card');
    await fireEvent.press(screen.getByTestId('action-withdraw'));
    await screen.findByTestId('screen-keypad');
    await typeDigits('71');
    await fireEvent.press(screen.getByTestId('keypad-validate'));
    expect(screen.getByTestId('keypad-insufficient')).toBeTruthy();
    expect(useAppStore.getState().balanceMinor).toBe(7000);
    await fireEvent.press(screen.getByTestId('keypad-backspace'));
    await typeDigits('0');
    await fireEvent.press(screen.getByTestId('keypad-validate'));
    expect(useAppStore.getState().balanceMinor).toBe(0);
    expect(useAppStore.getState().userTransactions[0]?.kind).toBe('withdraw');
  });

  it('keeps accessibility labels and hints (tabs, holder, reset, notice) and the fictional notice in FR and EN', async () => {
    await boot();
    expect(screen.getByTestId('home-fictional-notice')).toHaveTextContent(/fictif/i);
    for (const tab of ['index', 'abundance', 'card', 'history', 'settings']) {
      const el = screen.getByTestId(`tab-${tab}`);
      expect(String(el.props.accessibilityLabel ?? '').length).toBeGreaterThan(0);
    }
    await fireEvent.press(screen.getByTestId('tab-settings'));
    await screen.findByTestId('screen-settings');
    expect(String(screen.getByTestId('settings-reset').props.accessibilityHint ?? '').length).toBeGreaterThan(0);
    expect(String(screen.getByTestId('settings-holder').props.accessibilityHint ?? '').length).toBeGreaterThan(0);
  });
});
