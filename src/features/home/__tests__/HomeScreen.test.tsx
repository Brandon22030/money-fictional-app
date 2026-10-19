import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import { join } from 'path';

import { toMinor } from '@/src/domain/money';
import i18n from '@/src/i18n';
import { useAppStore } from '@/src/store/useAppStore';

const APP_DIR = join(__dirname, '..', '..', '..', '..', 'app');

function normalize(text: string): string {
  return text.replace(/[  ]/g, ' ');
}

describe('HomeScreen', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('fr');
    useAppStore.getState().resetAll();
    useAppStore.getState().setLanguage('fr');
    useAppStore.getState().setCurrency('EUR');
    useAppStore.getState().setBalance(toMinor(1250.5, 'EUR'));
  });

  it('shows the balance from the store with muted decimals', async () => {
    await renderRouter(APP_DIR);
    await screen.findByTestId('screen-home');

    expect(normalize(screen.getByTestId('amount-integer').props.children)).toBe('1 250');
    expect(screen.getByTestId('amount-decimals')).toBeTruthy();
    expect(screen.getByTestId('home-delta-percent')).toBeTruthy();
    expect(screen.getByTestId('home-delta-amount')).toBeTruthy();
  });

  it('shows no decimals for XOF', async () => {
    useAppStore.getState().setCurrency('XOF');
    useAppStore.getState().setBalance(toMinor(250000, 'XOF'));
    await renderRouter(APP_DIR);
    await screen.findByTestId('screen-home');

    expect(normalize(screen.getByTestId('amount-integer').props.children)).toBe('250 000');
    expect(screen.queryByTestId('amount-decimals')).toBeNull();
  });

  it('opens the keypad in set mode when the amount is tapped', async () => {
    await renderRouter(APP_DIR);
    await screen.findByTestId('screen-home');

    await fireEvent.press(screen.getByTestId('home-balance'));
    expect(screen).toHavePathname('/keypad');
    expect(screen).toHaveSearchParams({ mode: 'set' });
  });

  it('routes receive to the keypad', async () => {
    await renderRouter(APP_DIR);
    await screen.findByTestId('screen-home');

    await fireEvent.press(screen.getByTestId('home-receive'));
    expect(screen).toHaveSearchParams({ mode: 'receive' });
  });

  it('routes a favorite to the keypad with its contact', async () => {
    await renderRouter(APP_DIR);
    await screen.findByTestId('screen-home');

    await fireEvent.press(screen.getByTestId('home-favorite-family'));
    expect(screen).toHaveSearchParams({ mode: 'send', contact: 'family' });
  });

  it('shows the four abundance sources and routes each to the keypad', async () => {
    await renderRouter(APP_DIR);
    await screen.findByTestId('screen-home');

    expect(screen.getByText("Sources d'abondance")).toBeTruthy();
    for (const name of ['Univers', 'Gratitude', 'Moi futur', 'Famille']) {
      expect(screen.getByText(name)).toBeTruthy();
    }
    await fireEvent.press(screen.getByTestId('home-favorite-universe'));
    expect(screen).toHaveSearchParams({ mode: 'send', contact: 'universe' });
  });

  it('lists the five latest intentions and links to the history', async () => {
    await renderRouter(APP_DIR);
    await screen.findByTestId('screen-home');

    expect(screen.getAllByTestId(/^home-tx-/)).toHaveLength(5);
    await fireEvent.press(screen.getByTestId('home-see-all'));
    expect(screen).toHavePathname('/history');
  });

  it('shows a shared-with intention with the favorite name', async () => {
    useAppStore.getState().applyIntention('send', 100, {
      labelKey: 'content:intentions.sharedWith',
      labelParams: { contact: 'gratitude' },
    });
    await renderRouter(APP_DIR);
    await screen.findByTestId('screen-home');

    expect(screen.getByText('Partagé avec Gratitude')).toBeTruthy();
  });
});
