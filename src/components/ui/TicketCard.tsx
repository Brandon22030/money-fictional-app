import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { colors, radius, shadow, spacing } from '@/src/theme';

export type TicketCardProps = ViewProps & {
  style?: StyleProp<ViewStyle>;
};

export function TicketCard({ style, children, ...rest }: TicketCardProps) {
  return (
    <View {...rest} style={[styles.card, style]}>
      <View style={[styles.notch, styles.notchLeft]} />
      <View style={[styles.notch, styles.notchRight]} />
      {children}
    </View>
  );
}

const NOTCH = 14;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glassLight,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    ...shadow.card,
    shadowOpacity: 0.1,
  },
  notch: {
    position: 'absolute',
    top: '50%',
    marginTop: -NOTCH / 2,
    width: NOTCH,
    height: NOTCH,
    borderRadius: NOTCH / 2,
    backgroundColor: colors.skyMid,
  },
  notchLeft: {
    left: -NOTCH / 2,
  },
  notchRight: {
    right: -NOTCH / 2,
  },
});
