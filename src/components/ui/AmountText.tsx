import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { colors, fontFamily, fontSize, numbers } from '@/src/theme';

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
    fontFamily: fontFamily.bold,
    fontVariant: numbers.fontVariant,
    fontSize: size,
    lineHeight: Math.round(size * 1.2),
  };

  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={`${integer}${decimals ?? ''}${suffix ? ` ${suffix}` : ''}`}
      style={[{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' }, style]}
    >
      <Text testID="amount-integer" style={[base, { color: colors.textOnDark }]}>
        {integer}
      </Text>
      {decimals ? (
        <Text
          testID="amount-decimals"
          style={[base, { color: colors.textOnDarkMuted, fontSize: Math.round(size * 0.55) }]}
        >
          {decimals}
        </Text>
      ) : null}
      {suffix ? (
        <Text
          testID="amount-suffix"
          style={[base, { color: colors.textOnDarkMuted, fontSize: Math.round(size * 0.55) }]}
        >
          {` ${suffix}`}
        </Text>
      ) : null}
    </View>
  );
}
