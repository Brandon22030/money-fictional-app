import { act, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { BankCard } from '@/src/components/card/BankCard';
import { CARD_MAX_FONT_SIZE_MULTIPLIER, balanceTypography } from '@/src/components/card/CardFront';
import { MAX_BALANCE_MINOR, type Currency } from '@/src/config/locale';
import { formatMoney } from '@/src/domain/money';
import i18n from '@/src/i18n';

jest.mock('@/src/components/card/CardShine', () => ({ CardShine: () => null }));

const base = {
  holderName: 'BRANDON DANIEL MEDEHOU',
  cardNumber: '8402158733069914',
  expiry: '10/30',
  cvv: '417',
};

describe('MFA-005 reported case: BRANDON DANIEL MEDEHOU, 50 000 000 FCFA', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('fr');
  });

  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage('fr');
    });
  });

  it('renders the SOLDE label and the full amount, with the original mockup typography', async () => {
    const label = formatMoney(50_000_000, 'XOF', 'fr').full;
    expect(label).toContain('FCFA');
    await render(<BankCard {...base} balanceLabel={label} />);

    expect(screen.getByText('SOLDE')).toBeTruthy();
    const balance = screen.getByTestId('card-balance');
    expect(balance).toHaveTextContent(label);
    expect(balance.props.numberOfLines).toBe(1);
    const style = StyleSheet.flatten(balance.props.style);
    expect(style.fontSize).toBe(13);
    expect(style.letterSpacing).toBe(0.8);
    expect(balanceTypography(label)).toEqual({ fontSize: 13, letterSpacing: 0.8 });
  });

  it('keeps the holder name truncatable and the balance box from shrinking', async () => {
    const label = formatMoney(50_000_000, 'XOF', 'fr').full;
    await render(<BankCard {...base} balanceLabel={label} />);
    expect(screen.getByTestId('card-holder')).toHaveTextContent('BRANDON DANIEL MEDEHOU');
    expect(screen.getByTestId('card-holder').props.numberOfLines).toBe(1);
    const holderBox = StyleSheet.flatten(screen.getByTestId('card-holder-box').props.style);
    expect(holderBox.flexShrink).toBeGreaterThan(0);
    expect(holderBox.minWidth).toBe(0);
    const solde = screen.getByText('SOLDE');
    expect(solde.props.numberOfLines).toBe(1);
  });

  it.each<[Currency, 'fr' | 'en']>([
    ['XOF', 'fr'],
    ['EUR', 'fr'],
    ['USD', 'fr'],
    ['EUR', 'en'],
    ['USD', 'en'],
  ])('renders label and full maximal balance in %s (%s)', async (currency, language) => {
    await i18n.changeLanguage(language);
    const label = formatMoney(MAX_BALANCE_MINOR, currency, language).full;
    await render(<BankCard {...base} balanceLabel={label} />);

    expect(screen.getByText(language === 'fr' ? 'SOLDE' : 'BALANCE')).toBeTruthy();
    const balance = screen.getByTestId('card-balance');
    expect(balance).toHaveTextContent(label);
    expect(balance.props.numberOfLines).toBe(1);
    expect(balance.props.maxFontSizeMultiplier).toBe(CARD_MAX_FONT_SIZE_MULTIPLIER);
    const style = StyleSheet.flatten(balance.props.style);
    expect(style.fontSize).toBeLessThan(13);
    expect(style.fontSize).toBeGreaterThanOrEqual(9);
    // The computed typography fits the 125 px budget of the balance (estimated glyph width 0.55 em).
    expect(label.length * (style.fontSize * 0.55 + style.letterSpacing)).toBeLessThanOrEqual(125);
  });
});
