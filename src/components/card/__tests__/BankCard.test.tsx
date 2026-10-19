import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import i18n from '@/src/i18n';
import { colors, fontFamily } from '@/src/theme';
import { BankCard } from '@/src/components/card/BankCard';
import { CARD_FACE_PADDING } from '@/src/components/card/CardFront';
import { formatCardNumber } from '@/src/domain/card';

const mockShineWidths: number[] = [];

jest.mock('@/src/components/card/CardShine', () => ({
  CardShine: ({ width }: { width: number }) => {
    mockShineWidths.push(width);
    return null;
  },
}));

const props = {
  holderName: 'ÉLISE ADJOVI',
  cardNumber: '8402158733069914',
  expiry: '10/30',
  cvv: '417',
  balanceLabel: '186 420,50 €',
};

const hidden = { includeHiddenElements: true };

describe('BankCard', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('en');
  });

  it('renders the front with grouped number and fictional mention', async () => {
    await render(<BankCard {...props} />);

    expect(screen.getByTestId('card-number')).toHaveTextContent('8402 1587 3306 9914');
    expect(screen.getByTestId('card-holder')).toHaveTextContent('ÉLISE ADJOVI');
    expect(screen.getByTestId('card-balance')).toHaveTextContent('186 420,50 €');
    expect(screen.getByTestId('card-fictional-front', hidden)).toHaveTextContent(
      'FICTIONAL - SIMULATION',
    );
    expect(screen.getByText('EXPIRES', hidden)).toBeTruthy();
    expect(screen.getByTestId('card-chip', hidden)).toBeTruthy();
  });

  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    await render(<BankCard {...props} onPress={onPress} testID="card" />);

    await fireEvent.press(screen.getByTestId('card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('spans the fictional mention over the full card width, whatever the face padding', async () => {
    await render(<BankCard {...props} />);
    const mention = screen.getByTestId('card-fictional-front', hidden);
    // The padded content box that positions the mention.
    let box = mention.parent;
    while (box && StyleSheet.flatten(box.props.style)?.paddingHorizontal === undefined) {
      box = box.parent;
    }
    const padding = StyleSheet.flatten(box?.props.style);
    expect(padding).toMatchObject({
      paddingTop: CARD_FACE_PADDING.top,
      paddingHorizontal: CARD_FACE_PADDING.horizontal,
      paddingBottom: CARD_FACE_PADDING.bottom,
    });
    const style = StyleSheet.flatten(mention.props.style);
    expect(style.left).toBe(-CARD_FACE_PADDING.horizontal);
    expect(style.right).toBe(-CARD_FACE_PADDING.horizontal);
    // Same pixels as before the refactor: 8 pt above the card bottom edge.
    expect((style.bottom as number) + CARD_FACE_PADDING.bottom).toBe(8);
  });

  it('shows the back with CVV, signature and fictional mention when flipped', async () => {
    await render(<BankCard {...props} flipped />);

    expect(screen.getByTestId('card-cvv')).toHaveTextContent('417');
    expect(screen.getByTestId('card-stripe')).toBeTruthy();
    expect(screen.getByTestId('card-signature')).toBeTruthy();
    expect(screen.getByTestId('card-fictional-back')).toHaveTextContent('FICTIONAL - SIMULATION');
  });

  it.each(['card-fictional-front', 'card-fictional-back'])(
    'renders %s legibly: 11 px minimum, semiBold, full pearl color',
    async (testID) => {
      await render(<BankCard {...props} />);
      const style = StyleSheet.flatten(screen.getByTestId(testID, hidden).props.style);
      expect(style.fontSize).toBeGreaterThanOrEqual(11);
      expect(style.fontFamily).toBe(fontFamily.semiBold);
      expect(style.color).toBe(colors.goldPearl);
    },
  );

    it('describes the card as fictional for accessibility', async () => {
    await render(<BankCard {...props} testID="card" />);
    expect(screen.getByTestId('card').props.accessibilityLabel).toMatch(/Fictional/);
  });

  it('formats card numbers by groups of four', () => {
    expect(formatCardNumber('8402158733069914')).toBe('8402 1587 3306 9914');
    expect(formatCardNumber('8402 1587')).toBe('8402 1587');
  });

  it('re-renders on layout only when the width changes', async () => {
    await render(<BankCard {...props} testID="card" />);
    const card = screen.getByTestId('card');
    const layout = (width: number) => ({ nativeEvent: { layout: { x: 0, y: 0, width, height: 200 } } });

    await fireEvent(card, 'layout', layout(300));
    const afterFirst = mockShineWidths.length;
    expect(mockShineWidths.slice(-2)).toEqual([300, 300]);

    await fireEvent(card, 'layout', layout(300));
    expect(mockShineWidths).toHaveLength(afterFirst);

    await fireEvent(card, 'layout', layout(320));
    expect(mockShineWidths.length).toBeGreaterThan(afterFirst);
    expect(mockShineWidths.slice(-1)).toEqual([320]);
  });
});
