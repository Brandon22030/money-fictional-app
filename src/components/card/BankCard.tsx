import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { colors, gradients, radius, shadow } from '@/src/theme';

import { CardBack } from './CardBack';
import { CardFront } from './CardFront';
import { CardShine } from './CardShine';
import { useCardFlip } from './useCardFlip';

/** ISO/IEC 7810 ID-1 card aspect ratio (85.60 x 53.98 mm). */
export const CARD_RATIO = 1.586;

export type BankCardProps = {
  holderName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  balanceLabel: string;
  flipped?: boolean;
  onPress?: () => void;
  /** Slot for the brand mascot, rendered before the bank name on the front. */
  brandMark?: ReactNode;
  testID?: string;
};

const DEFAULT_WIDTH = 340;

function Face({
  children,
  padded = true,
}: {
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <LinearGradient
      colors={[...gradients.navyCard.colors, colors.navy900]}
      start={gradients.navyCard.start}
      end={gradients.navyCard.end}
      style={[styles.face, padded ? styles.padded : null]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(125,184,240,0.22)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 0.8 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </LinearGradient>
  );
}

export function BankCard({
  holderName,
  cardNumber,
  expiry,
  cvv,
  balanceLabel,
  flipped = false,
  onPress,
  brandMark,
  testID,
}: BankCardProps) {
  const { t } = useTranslation('card');
  const { frontStyle, backStyle, reduceMotion } = useCardFlip(flipped);
  const [width, setWidth] = useState(DEFAULT_WIDTH);

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onLayout={onLayout}
      accessibilityRole="button"
      accessibilityLabel={t(flipped ? 'a11y.back' : 'a11y.front')}
      accessibilityHint={t('a11y.hint')}
      style={styles.wrapper}
    >
      <Animated.View
        testID="card-face-front"
        style={[styles.layer, frontStyle]}
        accessibilityElementsHidden={flipped}
        importantForAccessibility={flipped ? 'no-hide-descendants' : 'auto'}
      >
        <Face>
          <CardFront
            holderName={holderName}
            cardNumber={cardNumber}
            expiry={expiry}
            balanceLabel={balanceLabel}
            brandMark={brandMark}
          />
          <CardShine width={width} disabled={reduceMotion || flipped} />
        </Face>
      </Animated.View>
      <Animated.View
        testID="card-face-back"
        style={[styles.layer, backStyle]}
        accessibilityElementsHidden={!flipped}
        importantForAccessibility={flipped ? 'auto' : 'no-hide-descendants'}
      >
        <Face padded={false}>
          <CardBack holderName={holderName} cardNumber={cardNumber} cvv={cvv} />
          <CardShine width={width} disabled={reduceMotion || !flipped} />
        </Face>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: 380,
    aspectRatio: CARD_RATIO,
    alignSelf: 'center',
    borderRadius: radius.lg,
    ...shadow.card,
  },
  layer: {
    ...StyleSheet.absoluteFill,
    backfaceVisibility: 'hidden',
    borderRadius: radius.lg,
  },
  padded: { padding: 22 },
  face: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.goldEdge,
  },
});
