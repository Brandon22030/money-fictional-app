import { act, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { BankCard } from '@/src/components/card/BankCard';
import { CARD_MAX_FONT_SIZE_MULTIPLIER, balanceTypography } from '@/src/components/card/CardFront';
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

  it('keeps the balance on one line, sized by balanceTypography, with its SOLDE label rendered', async () => {
    await render(<BankCard {...props} />);

    const balance = screen.getByTestId('card-balance');
    expect(balance.props.numberOfLines).toBe(1);
    // Its container does not shrink, so a native auto-fit would never trigger: the size is computed.
    expect(balance.props.adjustsFontSizeToFit).toBeUndefined();
    expect(StyleSheet.flatten(balance.props.style)).toMatchObject(
      balanceTypography('9 999 999 999 999 FCFA'),
    );
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

  it('caps the accessibility text size on every text of the number and bottom rows', async () => {
    await render(<BankCard {...props} />);

    expect(CARD_MAX_FONT_SIZE_MULTIPLIER).toBeGreaterThanOrEqual(1);
    expect(CARD_MAX_FONT_SIZE_MULTIPLIER).toBeLessThanOrEqual(1.3);
    for (const id of [
      'card-number',
      'card-holder-label',
      'card-holder',
      'card-expiry-label',
      'card-expiry',
      'card-balance-label',
      'card-balance',
    ]) {
      expect(screen.getByTestId(id).props.maxFontSizeMultiplier).toBe(CARD_MAX_FONT_SIZE_MULTIPLIER);
    }
    expect(screen.getByTestId('card-number').props.numberOfLines).toBe(1);
  });

  it('keeps the CARDHOLDER and EXPIRES labels on one line in English next to a maximal balance', async () => {
    await i18n.changeLanguage('en');
    try {
      await render(<BankCard {...props} balanceLabel="$9,999,999,999.99" />);

      expect(screen.getByTestId('card-holder-label')).toHaveTextContent('CARDHOLDER');
      expect(screen.getByTestId('card-holder-label').props.numberOfLines).toBe(1);
      expect(screen.getByTestId('card-expiry-label')).toHaveTextContent('EXPIRES');
      expect(screen.getByTestId('card-expiry-label').props.numberOfLines).toBe(1);
      expect(screen.getByTestId('card-balance-label').props.numberOfLines).toBe(1);
    } finally {
      await act(async () => {
        await i18n.changeLanguage('fr');
      });
    }
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

  it('decreases monotonically with the length and only shrinks past the width budget', () => {
    let previous = balanceTypography('');
    for (let length = 1; length <= 60; length += 1) {
      const current = balanceTypography('9'.repeat(length));
      expect(current.fontSize).toBeLessThanOrEqual(previous.fontSize);
      expect(current.letterSpacing).toBeLessThanOrEqual(previous.letterSpacing);
      const fullSizeWidth = length * (13 * 0.55 + 0.8);
      if (fullSizeWidth <= 125) {
        expect(current).toEqual({ fontSize: 13, letterSpacing: 0.8 });
      } else {
        expect(current.letterSpacing).toBeLessThan(0.8);
      }
      previous = current;
    }
  });
});
