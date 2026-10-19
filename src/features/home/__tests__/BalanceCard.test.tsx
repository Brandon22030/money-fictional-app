import { render, screen } from '@testing-library/react-native';

import { BalanceCard } from '@/src/features/home/BalanceCard';
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
    expect(screen.getByTestId('home-delta-amount')).toHaveTextContent(/^\+0,00\s€\s/);
  });

  it("counts today's user intentions in the daily delta", async () => {
    useAppStore.getState().applyIntention('receive', toMinor(10, 'EUR'));
    await render(<BalanceCard />);
    expect(screen.getByTestId('home-delta-amount')).toHaveTextContent(/^\+10,00\s€\s/);
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
    ['fr', 'pay', /^-1,5\s%$/],
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
    ['fr', 'Solde fictif - simulation'],
    ['en', 'Fictional balance - simulation'],
  ] as const)('shows the fictional mention under the balance in %s', async (language, text) => {
    await i18n.changeLanguage(language);
    useAppStore.getState().setLanguage(language);
    await render(<BalanceCard />);
    expect(screen.getByTestId('home-fictional-notice')).toHaveTextContent(text);
  });
});
