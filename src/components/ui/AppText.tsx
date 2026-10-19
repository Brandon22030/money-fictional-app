import { Text, type TextProps } from 'react-native';

import { colors, numbers, typography, type TextVariant } from '@/src/theme';

export type AppTextTone = 'onLight' | 'onLightMuted' | 'onDark' | 'onDarkMuted';

const TONE_COLORS: Record<AppTextTone, string> = {
  onLight: colors.textOnLight,
  onLightMuted: colors.textOnLightMuted,
  onDark: colors.textOnDark,
  onDarkMuted: colors.textOnDarkMuted,
};

export type AppTextProps = TextProps & {
  variant?: TextVariant;
  tone?: AppTextTone;
  tabular?: boolean;
};

export function AppText({
  variant = 'body',
  tone = 'onLight',
  tabular = false,
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      {...rest}
      style={[
        typography[variant],
        { color: TONE_COLORS[tone] },
        tabular ? { fontVariant: numbers.fontVariant } : null,
        style,
      ]}
    />
  );
}
