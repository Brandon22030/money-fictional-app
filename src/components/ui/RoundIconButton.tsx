import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius } from '@/src/theme';

export type RoundIconButtonProps = {
  icon: keyof typeof Feather.glyphMap;
  onPress?: () => void;
  accessibilityLabel: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function RoundIconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 44,
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
      <Feather name={icon} size={Math.round(size * 0.45)} color={colors.navy800} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassLight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  pressed: {
    opacity: 0.7,
  },
});
