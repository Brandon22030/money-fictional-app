import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui/AppText';
import { getLocaleTag } from '@/src/domain/money';
import type { IntentionKind } from '@/src/domain/types';
import { colors, font, numbers, shadows, ticket } from '@/src/theme';

export type TransactionTicketProps = {
  title: string;
  amountLabel: string;
  direction: 'in' | 'out';
  date: Date;
  locale: 'fr' | 'en';
  /** Kind of the transaction, used for the tab label when `kindLabel` is absent. */
  kind?: IntentionKind;
  /** Tab label, overrides the label derived from `kind` or `direction`. */
  kindLabel?: string;
  /** Day shown under the time, defaults to the short date without year. */
  dayLabel?: string;
  testID?: string;
};

export function TransactionTicket({
  title,
  amountLabel,
  direction,
  date,
  locale,
  kind,
  kindLabel,
  dayLabel,
  testID,
}: TransactionTicketProps) {
  const { t } = useTranslation('transactions');
  const intlLocale = getLocaleTag(locale);
  const time = date.toLocaleTimeString(intlLocale, {
    hour: '2-digit',
    minute: '2-digit',
  });
  const day =
    dayLabel ??
    date.toLocaleDateString(intlLocale, {
      day: 'numeric',
      month: 'short',
    });
  const tabLabel = kindLabel ?? t(`kind.${kind ?? (direction === 'in' ? 'receive' : 'send')}`);
  const sign = direction === 'in' ? '+' : '-';
  const signedAmount = `${sign}${amountLabel}`;

  return (
    <View
      testID={testID}
      style={styles.wrap}
      accessible
      accessibilityLabel={`${title}, ${tabLabel}, ${signedAmount}, ${day} ${time}`}
    >
      <View style={styles.card}>
        <LinearGradient
          colors={ticket.default.colors}
          start={ticket.default.start}
          end={ticket.default.end}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.tab}>
          <AppText variant="caption" style={styles.tabText} numberOfLines={1}>
            {tabLabel}
          </AppText>
        </View>
        <View style={styles.body}>
          <View style={styles.main}>
            <AppText variant="bodyStrong" style={styles.title} numberOfLines={2}>
              {title}
            </AppText>
            <AppText
              variant="title"
              tabular
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
              style={styles.amount}
            >
              {signedAmount}
            </AppText>
          </View>
          <View style={styles.meta}>
            <AppText variant="caption" tone="onLightMuted" tabular style={styles.metaText}>
              {time}
            </AppText>
            <AppText variant="caption" tone="onLightMuted" style={styles.metaText}>
              {day}
            </AppText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // The shadow lives on an unclipped, filled wrapper so iOS can draw it.
  wrap: {
    borderRadius: ticket.radius,
    backgroundColor: ticket.default.colors[1],
    ...shadows.ticket,
  },
  card: {
    borderRadius: ticket.radius,
    borderWidth: ticket.borderWidth,
    borderColor: ticket.borderColor,
    paddingTop: 30,
    paddingHorizontal: 16,
    paddingBottom: 14,
    overflow: 'hidden',
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
  tabText: {
    ...font(11, 'bold'),
    letterSpacing: 0.3,
    color: colors.textOnDark,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  main: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    ...font(15, 'bold'),
  },
  amount: {
    ...font(20, 'bold'),
    fontVariant: numbers.fontVariant,
    color: colors.navy800,
  },
  meta: {
    alignItems: 'flex-end',
  },
  metaText: {
    ...font(12, 'semiBold'),
  },
});
