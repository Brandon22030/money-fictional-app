import { render, screen, within } from '@testing-library/react-native';

import { BalanceCard, signedWholeUnits } from '@/src/features/home/BalanceCard';
import { toMinor } from '@/src/domain/money';
import i18n from '@/src/i18n';
import { useAppStore } from '@/src/store/useAppStore';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe('BalanceCard on the 1st of the month', () => {
  beforeEach(async () => {
    jest.useFakeTimers({ now: new Date(2026, 9, 1, 9, 0), advanceTimers: true });
    await i18n.changeLanguage('fr');
    useAppStore.getState().resetAll();
    useAppStore.getState().setLanguage('fr');
    useAppStore.getState().setCurrency('EUR');
    useAppStore.getState().setBalance(toMinor(1000, 'EUR'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('ignores demo intentions in the daily delta', async () => {
    await render(<BalanceCard />);
    expect(screen.getByTestId('home-delta-amount')).toHaveTextContent(/^\+0\s€\saujourd/);
  });

  it("counts today's user intentions in the daily delta", async () => {
    useAppStore.getState().applyIntention('receive', toMinor(10, 'EUR'));
    await render(<BalanceCard />);
    expect(screen.getByTestId('home-delta-amount')).toHaveTextContent(/^\+10\s€\saujourd/);
  });
});

describe('BalanceCard daily percent', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 9, 19, 9, 0), advanceTimers: true });
    useAppStore.getState().resetAll();
    useAppStore.getState().setCurrency('EUR');
    useAppStore.getState().setBalance(toMinor(1000, 'EUR'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each([
    ['fr', 'receive', /^\+1,5\s%$/],
    ['en', 'receive', /^\+1\.5%$/],
    ['fr', 'pay', /^-1,48\s%$/],
  ] as const)('formats the percent with the %s locale for %s', async (language, kind, expected) => {
    await i18n.changeLanguage(language);
    useAppStore.getState().setLanguage(language);
    if (kind === 'pay') useAppStore.getState().setBalance(toMinor(1015, 'EUR'));
    useAppStore.getState().applyIntention(kind, toMinor(15, 'EUR'));
    await render(<BalanceCard />);
    expect(screen.getByTestId('home-delta-percent')).toHaveTextContent(expected);
  });

  it('shows a signed zero without intentions today', async () => {
    await i18n.changeLanguage('en');
    useAppStore.getState().setLanguage('en');
    await render(<BalanceCard />);
    expect(screen.getByTestId('home-delta-percent')).toHaveTextContent(/^\+0%$/);
  });
});

describe('BalanceCard fictional notice', () => {
  it.each([
    ['fr', 'Fictif - simulation', 'Solde total'],
    ['en', 'Fictional - simulation', 'Total balance'],
  ] as const)('shows the mention on the label line in %s', async (language, text, label) => {
    await i18n.changeLanguage(language);
    useAppStore.getState().setLanguage(language);
    await render(<BalanceCard />);
    const row = within(screen.getByTestId('home-balance-label-row'));
    expect(row.getByText(label)).toBeTruthy();
    expect(row.getByTestId('home-fictional-notice')).toHaveTextContent(text);
  });
});

describe('BalanceCard pills and actions', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('fr');
    useAppStore.getState().resetAll();
    useAppStore.getState().setLanguage('fr');
    useAppStore.getState().setCurrency('EUR');
  });

  it('shows the up icon in the percent pill only', async () => {
    await render(<BalanceCard />);
    expect(screen.getByTestId('home-delta-percent').queryAll((node) => node.type === 'RNSVGSvgView')).toHaveLength(1);
    expect(screen.getByTestId('home-delta-amount').queryAll((node) => node.type === 'RNSVGSvgView')).toHaveLength(0);
  });

  it('rounds the daily amount to whole units', async () => {
    jest.useFakeTimers({ now: new Date(2026, 9, 19, 9, 0), advanceTimers: true });
    useAppStore.getState().setBalance(toMinor(1000, 'EUR'));
    useAppStore.getState().applyIntention('receive', toMinor(10.6, 'EUR'));
    await render(<BalanceCard />);
    expect(screen.getByTestId('home-delta-amount')).toHaveTextContent(/^\+11\s€\saujourd/);
    jest.useRealTimers();
  });

  it('renders the three actions with their labels', async () => {
    await render(<BalanceCard />);
    expect(screen.getByTestId('home-receive')).toHaveTextContent('Recevoir');
    expect(screen.getByTestId('home-send')).toHaveTextContent('Envoyer');
    expect(screen.getByTestId('home-voice')).toHaveTextContent('Écouter');
  });
});

describe('BalanceCard daily amount', () => {
  const nbsp = (text: string) => text.replace(/[\u00A0\u202F]/g, ' ');

  it.each([
    [-40, 'EUR', 'fr', '+0 €'],
    [40, 'EUR', 'fr', '+0 €'],
    [-49, 'EUR', 'fr', '+0 €'],
    [-50, 'EUR', 'fr', '-1 €'],
    [-160, 'EUR', 'fr', '-2 €'],
    [841200, 'EUR', 'fr', '+8 412 €'],
    [-5, 'XOF', 'fr', '-5 FCFA'],
    [0, 'XOF', 'fr', '+0 FCFA'],
    [-149, 'USD', 'en', '-$1'],
  ] as const)('formats %p minor %s (%s) as %p', (minor, currency, language, expected) => {
    expect(nbsp(signedWholeUnits(minor, currency, language))).toBe(expected);
  });

  it('never shows -0 when the day loss rounds to zero', async () => {
    jest.useFakeTimers({ now: new Date(2026, 9, 19, 9, 0), advanceTimers: true });
    try {
      await i18n.changeLanguage('fr');
      useAppStore.getState().resetAll();
      useAppStore.getState().setLanguage('fr');
      useAppStore.getState().setCurrency('EUR');
      useAppStore.getState().setBalance(toMinor(1000, 'EUR'));
      useAppStore.getState().applyIntention('pay', 40);
      await render(<BalanceCard />);
      expect(screen.getByTestId('home-delta-amount')).toHaveTextContent(/^\+0\s€\saujourd/);
    } finally {
      jest.useRealTimers();
    }
  });
});

