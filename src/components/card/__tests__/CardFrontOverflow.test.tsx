import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { BankCard } from '@/src/components/card/BankCard';
import { balanceTypography } from '@/src/components/card/CardFront';
import i18n from '@/src/i18n';

jest.mock('@/src/components/card/CardShine', () => ({ CardShine: () => null }));

const props = {
  holderName: 'BRANDON DANIEL MEDEHOU XYZ',
  cardNumber: '8402158733069914',
  expiry: '10/30',
  cvv: '417',
  balanceLabel: '9 999 999 999 999 FCFA',
};

describe('CardFront bottom row overflow', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('fr');
  });

  it('keeps the balance on one line, shrinkable, with its SOLDE label rendered', async () => {
    await render(<BankCard {...props} />);

    const balance = screen.getByTestId('card-balance');
    expect(balance.props.numberOfLines).toBe(1);
    expect(balance.props.adjustsFontSizeToFit).toBe(true);
    expect(balance.props.minimumFontScale).toBeGreaterThan(0);
    expect(balance).toHaveTextContent('9 999 999 999 999 FCFA');
    expect(screen.getByText('SOLDE')).toBeTruthy();
  });

  it('lets the holder name truncate and shrink while the expiry keeps its width', async () => {
    await render(<BankCard {...props} />);

    const holder = screen.getByTestId('card-holder');
    expect(holder.props.numberOfLines).toBe(1);
    const holderBox = StyleSheet.flatten(screen.getByTestId('card-holder-box').props.style);
    expect(holderBox.flexShrink).toBeGreaterThan(0);
    expect(holderBox.minWidth).toBe(0);
    const expiryBox = StyleSheet.flatten(screen.getByTestId('card-expiry-box').props.style);
    expect(expiryBox.flexShrink).toBe(0);
    expect(screen.getByTestId('card-expiry').props.numberOfLines).toBe(1);
  });
});

describe('balanceTypography', () => {
  it('keeps the mockup typography for the usual balances', () => {
    expect(balanceTypography('186 420,50 €')).toEqual({ fontSize: 13, letterSpacing: 0.8 });
    expect(balanceTypography('50 000 000 FCFA')).toEqual({ fontSize: 13, letterSpacing: 0.8 });
  });

  it('shrinks the largest balances, never below 9 px, and never grows', () => {
    const xof = balanceTypography('9 999 999 999 999 FCFA');
    const eur = balanceTypography('99 999 999 999,99 €');
    expect(xof.fontSize).toBeLessThan(13);
    expect(xof.fontSize).toBeGreaterThanOrEqual(9);
    expect(eur.fontSize).toBeLessThan(13);
    expect(balanceTypography('9'.repeat(60)).fontSize).toBe(9);
  });
});
