import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatCardNumber } from '@/src/domain/card';
import { colors, font, numbers } from '@/src/theme';

import { cardText } from './cardPalette';
import { EmvChip } from './EmvChip';
import { GoldBrandName } from './GoldBrandName';
import { NetworkLogo } from './NetworkLogo';

/**
 * Padding of the front face, applied by BankCard (`padded`). The fictional mention below is
 * positioned against this padded content box, so its offsets are derived from it.
 */
export const CARD_FACE_PADDING = { top: 20, horizontal: 22, bottom: 30 } as const;

/** Distance of the fictional mention box from the bottom edge of the card (calibrated on the mockup). */
const FICTIONAL_BOTTOM = 8;

/**
 * Largest Dynamic Type / font scale multiplier applied to the card texts. The card has a fixed
 * ratio and clips its content (overflow hidden), so its texts may only grow a little.
 */
export const CARD_MAX_FONT_SIZE_MULTIPLIER = 1.3;

const BALANCE_FONT_SIZE = 13;
const BALANCE_LETTER_SPACING = 0.8;
const BALANCE_MIN_FONT_SIZE = 9;
/** Width (px) the balance may take next to the holder name and the expiry on the narrowest card. */
const BALANCE_BUDGET_WIDTH = 125;
/** Tighter tracking for the long labels, which would not fit with the regular one. */
const BALANCE_TIGHT_LETTER_SPACING = 0.2;
/** Average glyph width of the semiBold digits, as a fraction of the font size. */
const BALANCE_GLYPH_RATIO = 0.55;

/** Estimated width (px) of a label at the given typography. */
function estimatedWidth(label: string, fontSize: number, letterSpacing: number): number {
  return label.length * (fontSize * BALANCE_GLYPH_RATIO + letterSpacing);
}

/**
 * Typography of the balance: 13 px / 0.8 (mockup) while its estimated width fits
 * BALANCE_BUDGET_WIDTH ("186 420,50 €", "50 000 000 FCFA"), then a tighter tracking and a size
 * that decreases with the length (down to 9) so that the largest balances
 * ("9 999 999 999 999 FCFA") fit next to the expiry. It is computed, not measured, so it holds on
 * every platform; the balance container does not shrink, hence no `adjustsFontSizeToFit`, and the
 * growth with the accessibility text size is capped by CARD_MAX_FONT_SIZE_MULTIPLIER.
 */
export function balanceTypography(label: string): { fontSize: number; letterSpacing: number } {
  if (estimatedWidth(label, BALANCE_FONT_SIZE, BALANCE_LETTER_SPACING) <= BALANCE_BUDGET_WIDTH) {
    return { fontSize: BALANCE_FONT_SIZE, letterSpacing: BALANCE_LETTER_SPACING };
  }
  const fitted =
    (BALANCE_BUDGET_WIDTH / label.length - BALANCE_TIGHT_LETTER_SPACING) / BALANCE_GLYPH_RATIO;
  return {
    fontSize: Math.min(BALANCE_FONT_SIZE, Math.max(BALANCE_MIN_FONT_SIZE, fitted)),
    letterSpacing: BALANCE_TIGHT_LETTER_SPACING,
  };
}

export type CardFrontProps = {
  holderName: string;
  cardNumber: string;
  expiry: string;
  balanceLabel: string;
  brandMark?: ReactNode;
};

export function CardFront({ holderName, cardNumber, expiry, balanceLabel, brandMark }: CardFrontProps) {
  const { t } = useTranslation('card');
  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <View style={styles.brand}>
          {brandMark}
          <GoldBrandName />
        </View>
        <NetworkLogo testID="card-network-logo" />
      </View>
      <View style={styles.mid}>
        <EmvChip testID="card-chip" />
      </View>
      <Text
        testID="card-number"
        style={[styles.number, { fontVariant: numbers.fontVariant }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        maxFontSizeMultiplier={CARD_MAX_FONT_SIZE_MULTIPLIER}
      >
        {formatCardNumber(cardNumber)}
      </Text>
      <View style={styles.bottom}>
        <View testID="card-holder-box" style={styles.holder}>
          <Text
            testID="card-holder-label"
            style={styles.label}
            numberOfLines={1}
            maxFontSizeMultiplier={CARD_MAX_FONT_SIZE_MULTIPLIER}
          >
            {t('holder')}
          </Text>
          <Text
            testID="card-holder"
            style={styles.value}
            numberOfLines={1}
            maxFontSizeMultiplier={CARD_MAX_FONT_SIZE_MULTIPLIER}
          >
            {holderName}
          </Text>
        </View>
        <View testID="card-expiry-box" style={styles.expiry}>
          <Text
            testID="card-expiry-label"
            style={styles.label}
            numberOfLines={1}
            maxFontSizeMultiplier={CARD_MAX_FONT_SIZE_MULTIPLIER}
          >
            {t('validThru')}
          </Text>
          <Text
            testID="card-expiry"
            style={[styles.value, { fontVariant: numbers.fontVariant }]}
            numberOfLines={1}
            maxFontSizeMultiplier={CARD_MAX_FONT_SIZE_MULTIPLIER}
          >
            {expiry}
          </Text>
        </View>
        <View style={styles.balance}>
          <Text
            testID="card-balance-label"
            style={styles.label}
            numberOfLines={1}
            maxFontSizeMultiplier={CARD_MAX_FONT_SIZE_MULTIPLIER}
          >
            {t('balance')}
          </Text>
          <Text
            testID="card-balance"
            style={[
              styles.value,
              { fontVariant: numbers.fontVariant, ...balanceTypography(balanceLabel) },
            ]}
            numberOfLines={1}
            maxFontSizeMultiplier={CARD_MAX_FONT_SIZE_MULTIPLIER}
          >
            {balanceLabel}
          </Text>
        </View>
      </View>
      <Text testID="card-fictional-front" style={styles.fictional}>
        {t('fictional')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'space-between' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mid: { flexDirection: 'row', alignItems: 'center' },
  // Full card width: on native, the enlarged (accessibility) number shrinks back onto one line.
  number: {
    ...font(21, 'semiBold'),
    letterSpacing: 2.2,
    color: cardText.main,
  },
  bottom: { flexDirection: 'row', alignItems: 'flex-end', gap: 20, marginBottom: 1 },
  // Bottom row priority: the balance (and its label) keeps its width, sized by balanceTypography;
  // the holder name gives way first (ellipsis), the expiry keeps its width.
  holder: { flexShrink: 1, minWidth: 0 },
  expiry: { flexShrink: 0 },
  balance: { flexShrink: 0, marginLeft: 'auto', alignItems: 'flex-end' },
  label: { ...font(8, 'regular'), letterSpacing: 1.4, color: cardText.label, marginBottom: 4 },
  value: { ...font(13, 'semiBold'), letterSpacing: 0.8, color: cardText.main },
  // C2: 11 px / semiBold / pearl kept for legibility, position of the mockup (absolute, bottom 10).
  // Offsets cancel the face padding: full card width, FICTIONAL_BOTTOM from the card bottom.
  fictional: {
    ...font(11, 'semiBold'),
    position: 'absolute',
    left: -CARD_FACE_PADDING.horizontal,
    right: -CARD_FACE_PADDING.horizontal,
    bottom: FICTIONAL_BOTTOM - CARD_FACE_PADDING.bottom,
    letterSpacing: 1.6,
    color: colors.goldPearl,
    textAlign: 'center',
  },
});
