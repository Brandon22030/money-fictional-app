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
