import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { blur, glass, radius, shadow } from '@/src/theme';

export type NavyCardProps = ViewProps & {
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

function Highlight() {
  const id = `navy-highlight-${useId().replace(/:/g, '')}`;

  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id={id} cx="85%" cy="-10%" rx="120%" ry="70%">
          <Stop offset="0" stopColor={glass.highlight} />
          <Stop offset="0.6" stopColor={glass.highlight} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

export function NavyCard({ style, contentStyle, children, ...rest }: NavyCardProps) {
  return (
    <View {...rest} style={[styles.shadow, style]}>
      <View style={styles.card}>
        <BlurView intensity={16} tint="light" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={[...glass.colors]}
          start={glass.start}
          end={glass.end}
          style={StyleSheet.absoluteFill}
        />
        <Highlight />
        <View style={contentStyle}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: radius.lg,
    ...shadow.card,
  },
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: glass.borderWidth,
    borderColor: glass.borderColor,
  },
});
