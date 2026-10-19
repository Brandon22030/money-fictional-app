import { render, screen } from '@testing-library/react-native';

import { TransactionTicket } from '@/src/components/transactions/TransactionTicket';
import '@/src/i18n';

const DATE = new Date(2026, 2, 15, 14, 30);

describe('TransactionTicket', () => {
  it('shows a plus sign for incoming amounts', async () => {
    await render(
      <TransactionTicket
        title="Salaire"
        amountLabel="10 EUR"
        direction="in"
        date={DATE}
        locale="fr"
      />,
    );
    expect(screen.getByText('+ 10 EUR')).toBeTruthy();
    expect(screen.getByText('Salaire')).toBeTruthy();
  });

  it('shows a minus sign for outgoing amounts', async () => {
    await render(
      <TransactionTicket
        title="Cafe"
        amountLabel="3 EUR"
        direction="out"
        date={DATE}
        locale="en"
      />,
    );
    expect(screen.getByText('- 3 EUR')).toBeTruthy();
  });

  it('formats the date according to the locale', async () => {
    const { rerender } = await render(
      <TransactionTicket title="A" amountLabel="1" direction="in" date={DATE} locale="fr" />,
    );
    expect(screen.getByText(/mars/)).toBeTruthy();
    await rerender(
      <TransactionTicket title="A" amountLabel="1" direction="in" date={DATE} locale="en" />,
    );
    expect(screen.getByText(/Mar/)).toBeTruthy();
    expect(screen.queryByText(/mars/)).toBeNull();
  });
});
