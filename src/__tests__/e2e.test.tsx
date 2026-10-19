/// <reference path="../../node_modules/expo-router/build/ts-declarations/expect.d.ts" />
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { join } from 'path';
import { Alert } from 'react-native';

import { formatMoney } from '@/src/domain/money';
import i18n from '@/src/i18n';
import { setVoiceProvider, type VoiceProvider } from '@/src/services/voice';
import { useAppStore } from '@/src/store/useAppStore';

const APP_DIR = join(__dirname, '..', '..', 'app');

const norm = (text: unknown) => String(text).replace(/[  ]/g, ' ');

async function typeDigits(digits: string) {
  for (const digit of digits) {
    await fireEvent.press(screen.getByTestId(`keypad-${digit}`));
  }
}

async function goTab(name: string) {
  await fireEvent.press(screen.getByTestId(`tab-${name}`));
  await screen.findByTestId(`screen-${name === 'index' ? 'home' : name}`);
}

async function boot(opts: { currency?: 'EUR' | 'XOF' | 'USD'; language?: 'fr' | 'en'; balanceMajor?: number } = {}) {
  const currency = opts.currency ?? 'EUR';
  const language = opts.language ?? 'fr';
  await act(async () => {
    useAppStore.getState().resetAll();
    useAppStore.getState().setLanguage(language);
    useAppStore.getState().setCurrency(currency);
    useAppStore.getState().setBalance((opts.balanceMajor ?? 1000) * (currency === 'XOF' ? 1 : 100));
    await i18n.changeLanguage(language);
  });
  await renderRouter(APP_DIR);
  await screen.findByTestId('screen-home');
}

describe('end to end flows', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('set balance from Home, then card and history reflect it without creating an intention', async () => {
    await boot();
    const before = useAppStore.getState().userTransactions.length;

    await fireEvent.press(screen.getByTestId('home-balance'));
    await screen.findByTestId('screen-keypad');
    expect(screen).toHaveSearchParams({ mode: 'set' });
    await fireEvent.press(screen.getByTestId('keypad-backspace'));
    await fireEvent.press(screen.getByTestId('keypad-backspace'));
    await fireEvent.press(screen.getByTestId('keypad-backspace'));
    await fireEvent.press(screen.getByTestId('keypad-backspace'));
    await fireEvent.press(screen.getByTestId('keypad-backspace'));
    await fireEvent.press(screen.getByTestId('keypad-backspace'));
    await typeDigits('777');
    await fireEvent.press(screen.getByTestId('keypad-validate'));

    expect(useAppStore.getState().balanceMinor).toBe(77700);
    expect(useAppStore.getState().userTransactions).toHaveLength(before);
    await screen.findByTestId('screen-home');
    expect(norm(screen.getByTestId('amount-integer').props.children)).toBe('777');

    await goTab('card');
    expect(screen.getByTestId('card-balance')).toHaveTextContent(/777/);
  });

  it('receive from Home credits the balance and appears in History and on the card', async () => {
    await boot();
    await fireEvent.press(screen.getByTestId('home-receive'));
    await screen.findByTestId('screen-keypad');
    expect(screen).toHaveSearchParams({ mode: 'receive' });
    await typeDigits('250');
    await fireEvent.press(screen.getByTestId('keypad-validate'));

    expect(useAppStore.getState().balanceMinor).toBe(125000);
    expect(useAppStore.getState().userTransactions[0]?.kind).toBe('receive');
    await screen.findByTestId('screen-home');
    expect(norm(screen.getByTestId('amount-integer').props.children)).toBe('1 250');

    await goTab('card');
    const label = formatMoney(125000, 'EUR', 'fr').full;
    expect(screen.getByTestId('card-balance')).toHaveTextContent(label);

    await goTab('history');
    const tx = useAppStore.getState().userTransactions[0]!;
    expect(screen.getByTestId(`history-item-${tx.id}`)).toBeTruthy();
    expect(screen.getByText('Argent reçu')).toBeTruthy();
  });

  it('refuses a debit larger than the balance with a gentle message, balance untouched', async () => {
    await boot({ balanceMajor: 100 });
    await fireEvent.press(screen.getByTestId('home-send'));
    await screen.findByTestId('screen-keypad');
    await typeDigits('101');
    await fireEvent.press(screen.getByTestId('keypad-validate'));

    expect(screen.getByTestId('keypad-insufficient')).toBeTruthy();
    expect(screen).toHavePathname('/keypad');
    expect(useAppStore.getState().balanceMinor).toBe(10000);
    expect(useAppStore.getState().userTransactions).toHaveLength(0);
  });

  it('accepts a debit equal to the balance (balance reaches zero)', async () => {
    await boot({ balanceMajor: 100 });
    await fireEvent.press(screen.getByTestId('home-send'));
    await screen.findByTestId('screen-keypad');
    await typeDigits('100');
    await fireEvent.press(screen.getByTestId('keypad-validate'));
    expect(useAppStore.getState().balanceMinor).toBe(0);
    expect(useAppStore.getState().userTransactions[0]?.kind).toBe('send');
  });

  it('switching to XOF drops decimals everywhere and switching to EN speaks the English sentence', async () => {
    await boot({ balanceMajor: 1250 });
    await goTab('settings');
    await fireEvent.press(screen.getByTestId('settings-currency-XOF'));
    await fireEvent.press(screen.getByTestId('settings-language-en'));
    await screen.findByText('Currency');

    expect(useAppStore.getState().currency).toBe('XOF');
    expect(useAppStore.getState().language).toBe('en');
    expect(i18n.language).toBe('en');

    await goTab('index');
    expect(screen.queryByTestId('amount-decimals')).toBeNull();
    const minor = useAppStore.getState().balanceMinor;
    expect(Number.isInteger(minor)).toBe(true);

    await goTab('card');
    expect(screen.getByTestId('card-balance')).toHaveTextContent(formatMoney(minor, 'XOF', 'en').full);
    expect(screen.getByTestId('card-fictional-front')).toHaveTextContent('FICTIONAL - SIMULATION');

    const speak = jest.fn(async () => undefined);
    const provider: VoiceProvider = {
      speak,
      stop: jest.fn(async () => undefined),
      isSpeaking: jest.fn(async () => false),
    };
    setVoiceProvider(provider);
    await goTab('index');
    await fireEvent.press(screen.getByTestId('home-voice'));
    await waitFor(() => expect(speak).toHaveBeenCalled());
    const spoken = (speak.mock.calls[0] as unknown as [string, { language: string }])[0];
    expect(spoken).toMatch(/^Your current bank balance is /);
    expect(spoken).toMatch(/CFA francs/);
    expect(spoken).not.toMatch(/cents/);
  });

  it('French sentence with euros on the Home voice button', async () => {
    await boot({ balanceMajor: 1250 });
    const speak = jest.fn(async () => undefined);
    setVoiceProvider({
      speak,
      stop: jest.fn(async () => undefined),
      isSpeaking: jest.fn(async () => false),
    });
    await fireEvent.press(screen.getByTestId('home-voice'));
    await waitFor(() => expect(speak).toHaveBeenCalled());
    const spoken = (speak.mock.calls[0] as unknown as [string])[0];
    expect(spoken).toMatch(/^Votre solde bancaire actuel est de /);
    expect(spoken).toMatch(/1250 euros/);
  });

  it('persists to storage and rehydrates', async () => {
    await boot();
    await act(async () => {
      useAppStore.getState().setBalance(424200);
      useAppStore.getState().setHolderName('ada lovelace');
      useAppStore.getState().applyIntention('receive', 100);
    });
    const raw = await AsyncStorage.getItem('abonda-store-v1');
    expect(raw).toBeTruthy();
    const persisted = JSON.parse(raw as string);
    expect(persisted.state.balanceMinor).toBe(424200 + 100);
    expect(persisted.state.holderName).toBe('ADA LOVELACE');
    expect(persisted.state.hasHydrated).toBeUndefined();

    await act(async () => {
      useAppStore.setState({ balanceMinor: 1, holderName: 'X', userTransactions: [] });
      // setState re-persists; restore the earlier snapshot to simulate a cold restart.
      await AsyncStorage.setItem('abonda-store-v1', raw as string);
      await useAppStore.persist.rehydrate();
    });
    expect(useAppStore.getState().balanceMinor).toBe(424300);
    expect(useAppStore.getState().holderName).toBe('ADA LOVELACE');
    expect(useAppStore.getState().userTransactions).toHaveLength(1);
    expect(useAppStore.getState().hasHydrated).toBe(true);
  });

  it('reset from Settings (after confirmation) restores defaults and clears intentions', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await boot();
    await act(async () => {
      useAppStore.getState().applyIntention('receive', 5000);
      useAppStore.getState().setHolderName('someone');
    });
    await goTab('settings');
    await fireEvent.press(screen.getByTestId('settings-reset'));
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(useAppStore.getState().userTransactions).toHaveLength(1);
    const buttons = alertSpy.mock.calls[0]?.[2] ?? [];
    const cancel = buttons.find((b) => b.style === 'cancel');
    expect(cancel).toBeDefined();
    await act(async () => {
      buttons.find((b) => b.style === 'destructive')?.onPress?.();
    });
    expect(useAppStore.getState().userTransactions).toHaveLength(0);
    expect(useAppStore.getState().holderName).not.toBe('SOMEONE');
  });

  it('History search filters user intentions and demo ones; no share or export control anywhere', async () => {
    await boot();
    await act(async () => {
      useAppStore.getState().applyIntention('pay', 1234, { labelKey: 'content:intentions.coffee' });
    });
    await goTab('history');
    await fireEvent.changeText(screen.getByTestId('history-search'), 'zzzz-nothing');
    expect(screen.getByTestId('history-empty')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('history-search'), 'Café du matin');
    expect(screen.queryByTestId('history-empty')).toBeNull();
    expect(screen.getAllByText('Café du matin').length).toBeGreaterThan(0);
    await fireEvent.changeText(screen.getByTestId('history-search'), '');
    expect(screen.queryByTestId('history-empty')).toBeNull();
  });

  const SCREENS = ['index', 'card', 'abundance', 'history', 'settings'].flatMap((tab) =>
    (['fr', 'en'] as const).map((language) => [tab, language] as const),
  );
  it.each(SCREENS)(
    'screen %s (%s) exposes no share, export, copy or capture control',
    async (tab, language) => {
      {
        await boot({ language });
        await goTab(tab);
        const forbidden = /partager|exporter|export|share|copier|copy|capture|screenshot|imprimer|print/i;
        const labels: string[] = [];
        const walk = (node: unknown): void => {
          if (!node || typeof node !== 'object') return;
          if (Array.isArray(node)) return node.forEach(walk);
          const n = node as { props?: Record<string, unknown>; children?: unknown };
          const label = n.props?.accessibilityLabel;
          if (typeof label === 'string') labels.push(label);
          walk(n.children);
        };
        walk(screen.toJSON());
        expect(labels.length).toBeGreaterThan(0);
        for (const label of labels) {
          expect(label).not.toMatch(forbidden);
        }
        expect(screen.queryByText(forbidden)).toBeNull();
      }
    },
  );

  it('unknown keypad mode falls back to set (deep link)', async () => {
    await boot();
    await act(async () => {
      router.push('/keypad?mode=bogus');
    });
    await screen.findByTestId('screen-keypad');
    expect(screen.getByText('Définir mon solde')).toBeTruthy();
  });
});
