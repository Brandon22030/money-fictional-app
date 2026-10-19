import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/src/theme';

import { AppText, type AppTextTone } from './AppText';

export type PillProps = {
  label: string;
  tone?: AppTextTone;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Pill({ label, tone = 'onDark', style, testID }: PillProps) {
  return (
    <View testID={testID} style={[styles.pill, style]}>
      <AppText variant="caption" tone={tone} tabular>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
});
