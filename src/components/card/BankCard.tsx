import { LinearGradient } from 'expo-linear-gradient';
import { useId, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { getVisualFixture } from '@/src/dev/visualFixture';
import { bankCard, shadows } from '@/src/theme';

import { CardBack } from './CardBack';
import { CardFront } from './CardFront';
import { CardShine } from './CardShine';
import { useCardFlip } from './useCardFlip';

/** Card size of the mockup (index.html:126). */
export const CARD_WIDTH = 350;
export const CARD_HEIGHT = 221;
export const CARD_RATIO = CARD_WIDTH / CARD_HEIGHT;

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

const DEFAULT_WIDTH = CARD_WIDTH;

function Reflection() {
  const id = `card-reflection-${useId().replace(/\W/g, '')}`;
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id={id} cx={0.85} cy={-0.1} rx={1.2} ry={0.9}>
          <Stop offset="0" stopColor={bankCard.radial} />
          <Stop offset="0.6" stopColor={bankCard.radial} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

function Face({
  children,
  padded = true,
}: {
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <LinearGradient
      colors={[...bankCard.linear.colors]}
      locations={[...bankCard.linear.locations]}
      start={bankCard.linear.start}
      end={bankCard.linear.end}
      style={styles.face}
    >
      <Reflection />
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
        locations={[0.35, 0.5, 0.65]}
        start={{ x: -0.066, y: 0.175 }}
        end={{ x: 1.066, y: 0.825 }}
        style={styles.gloss}
      />
      {/* Padding lives on this inner view: on iOS, percentage sizes of absolute children
          resolve against the parent's content box, so a padded face would shrink the
          reflection Svg (width="100%") and cut it with a hard edge. */}
      <View style={[styles.content, padded ? styles.padded : null]}>{children}</View>
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
  // The sweep is switched off for the visual harness so that captures are stable.
  const sweepOff = getVisualFixture() !== undefined;

  const onLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    if (next !== width) setWidth(next);
  };

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
          <CardShine width={width} disabled={reduceMotion || flipped || sweepOff} />
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
          <CardShine width={width} disabled={reduceMotion || !flipped || sweepOff} />
        </Face>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: CARD_WIDTH,
    aspectRatio: CARD_RATIO,
    alignSelf: 'center',
    borderRadius: bankCard.radius,
    ...shadows.bankCard,
  },
  layer: {
    ...StyleSheet.absoluteFill,
    backfaceVisibility: 'hidden',
    borderRadius: bankCard.radius,
  },
  content: { flex: 1 },
  padded: { paddingTop: 20, paddingHorizontal: 22, paddingBottom: 30 },
  face: {
    flex: 1,
    borderRadius: bankCard.radius,
    overflow: 'hidden',
    borderWidth: bankCard.borderWidth,
    borderColor: bankCard.borderColor,
  },
  // Static band of the mockup (`.shine`): inset -40% -20%.
  gloss: { position: 'absolute', top: '-40%', bottom: '-40%', left: '-20%', right: '-20%' },
});
