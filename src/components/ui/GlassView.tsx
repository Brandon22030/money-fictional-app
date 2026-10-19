import { BlurView } from 'expo-blur';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { blur, colors, radius } from '@/src/theme';

export type GlassViewProps = ViewProps & {
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

export function GlassView({ borderRadius = radius.lg, style, children, ...rest }: GlassViewProps) {
  return (
    <View {...rest} style={[styles.container, { borderRadius }, style]}>
      <BlurView intensity={blur.glass} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.fill]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  fill: {
    backgroundColor: colors.glassFill,
  },
});
