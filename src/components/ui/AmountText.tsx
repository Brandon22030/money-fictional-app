import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { colors, font, fontSize, numbers } from '@/src/theme';

/** Smallest scale the amount may shrink to (native) so the largest balance still fits one line. */
export const AMOUNT_MIN_FONT_SCALE = 0.3;

export type AmountTextProps = {
  integer: string;
  decimals?: string;
  suffix?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function AmountText({
  integer,
  decimals,
  suffix,
  size = fontSize.display,
  style,
  testID,
}: AmountTextProps) {
  const base: TextStyle = {
    ...font(size, 'bold'),
    fontVariant: numbers.fontVariant,
    letterSpacing: -1,
  };
  const muted: TextStyle = { ...font(size, 'semiBold'), color: colors.textOnDarkMuted };

  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={`${integer}${decimals ?? ''}${suffix ? ` ${suffix}` : ''}`}
      style={style}
    >
      <Text
        testID="amount-text"
        style={base}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={AMOUNT_MIN_FONT_SCALE}
      >
        <Text testID="amount-integer" style={{ color: colors.textOnDark }}>
          {integer}
        </Text>
        {decimals ? (
          <Text testID="amount-decimals" style={muted}>
            {decimals}
          </Text>
        ) : null}
        {suffix ? (
          <Text testID="amount-suffix" style={muted}>
            {` ${suffix}`}
          </Text>
        ) : null}
      </Text>
    </View>
  );
}
