import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, font, numbers, radius } from '@/src/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export type PillProps = {
  label: string;
  icon?: IconName;
  color?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Pill({ label, icon, color = colors.textOnDark, style, testID }: PillProps) {
  return (
    <View testID={testID} style={[styles.pill, style]}>
      {icon ? <Icon name={icon} size={14} color={color} /> : null}
      <AppText variant="caption" tone="onDark" style={[styles.label, { color }]}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  label: {
    ...font(12, 'semiBold'),
    fontVariant: numbers.fontVariant,
  },
});
