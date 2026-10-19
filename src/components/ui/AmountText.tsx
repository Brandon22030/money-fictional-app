import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { colors, font, fontSize, numbers } from '@/src/theme';

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
      <Text style={base}>
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
