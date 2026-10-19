import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { colors, gradients, radius, shadow } from '@/src/theme';

export type NavyCardProps = ViewProps & {
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export function NavyCard({ style, contentStyle, children, ...rest }: NavyCardProps) {
  return (
    <View {...rest} style={[styles.shadow, style]}>
      <LinearGradient
        colors={[...gradients.navyCard.colors]}
        start={gradients.navyCard.start}
        end={gradients.navyCard.end}
        style={styles.card}
      >
        <View style={[styles.content, contentStyle]}>{children}</View>
      </LinearGradient>
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  content: {
    padding: 20,
  },
});
