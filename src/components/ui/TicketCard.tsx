import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { colors, font, shadows, ticket } from '@/src/theme';

import { AppText } from './AppText';

export type TicketVariant = 'default' | 'affirmation';

export type TicketCardProps = ViewProps & {
  variant?: TicketVariant;
  tab?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export function TicketCard({
  variant = 'default',
  tab,
  style,
  contentStyle,
  children,
  ...rest
}: TicketCardProps) {
  const palette = ticket[variant];

  return (
    <View {...rest} style={[styles.shadow, style]}>
      <LinearGradient
        colors={[...palette.colors]}
        start={palette.start}
        end={palette.end}
        style={styles.card}
      >
        <View style={[styles.content, contentStyle]}>{children}</View>
        {tab ? (
          <View testID="ticket-tab" style={styles.tab}>
            <AppText variant="caption" style={styles.tabLabel}>
              {tab}
            </AppText>
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: ticket.radius,
    ...shadows.ticket,
  },
  card: {
    borderRadius: ticket.radius,
    overflow: 'hidden',
    borderWidth: ticket.borderWidth,
    borderColor: ticket.borderColor,
  },
  content: {
    paddingTop: 30,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  tab: {
    position: 'absolute',
    top: 0,
    left: 14,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: colors.navy800,
  },
  tabLabel: {
    ...font(11, 'bold'),
    letterSpacing: 0.3,
    color: colors.textOnDark,
  },
});
