import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius } from '@/src/theme';

import { Icon, type IconName } from './Icon';

export type RoundIconButtonProps = {
  icon: IconName;
  onPress?: () => void;
  accessibilityLabel: string;
  size?: number;
  badge?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function RoundIconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 44,
  badge = false,
  style,
  testID,
}: RoundIconButtonProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size, borderRadius: radius.pill },
        pressed ? styles.pressed : null,
        style,
      ]}
    >
      <Icon name={icon} size={Math.round(size * 0.45)} color={colors.navy800} />
      {badge ? <View testID={testID ? `${testID}-badge` : undefined} style={styles.badge} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassLight,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  badge: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  pressed: {
    opacity: 0.7,
  },
});
