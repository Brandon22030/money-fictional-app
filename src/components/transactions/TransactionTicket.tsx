import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui/AppText';
import { colors, radius, spacing } from '@/src/theme';

export type FeatherIconName = keyof typeof Feather.glyphMap;

export type TransactionTicketProps = {
  title: string;
  amountLabel: string;
  direction: 'in' | 'out';
  date: Date;
  locale: 'fr' | 'en';
  icon?: FeatherIconName;
  testID?: string;
};

const INTL_LOCALES = { fr: 'fr-FR', en: 'en-US' } as const;

export function TransactionTicket({
  title,
  amountLabel,
  direction,
  date,
  locale,
  icon,
  testID,
}: TransactionTicketProps) {
  const { t } = useTranslation('transactions');
  const intlLocale = INTL_LOCALES[locale];
  const time = date.toLocaleTimeString(intlLocale, {
    hour: '2-digit',
    minute: '2-digit',
  });
  const day = date.toLocaleDateString(intlLocale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const sign = direction === 'in' ? '+' : '-';
  const signedAmount = `${sign} ${amountLabel}`;

  return (
    <View
      testID={testID}
      style={styles.wrap}
      accessible
      accessibilityLabel={`${title}, ${t(`direction.${direction}`)}, ${signedAmount}, ${day} ${time}`}
    >
      <View style={styles.tab}>
        {icon ? <Feather name={icon} size={14} color={colors.navy800} /> : null}
        <AppText variant="caption" style={styles.tabText} numberOfLines={1}>
          {title}
        </AppText>
      </View>
      <View style={styles.body}>
        <AppText variant="title" tabular style={direction === 'in' ? styles.in : styles.out}>
          {signedAmount}
        </AppText>
        <View style={styles.meta}>
          <AppText variant="caption" tone="onLightMuted" tabular>
            {time}
          </AppText>
          <AppText variant="caption" tone="onLightMuted">
            {day}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: spacing.xl,
  },
  tab: {
    position: 'absolute',
    top: 0,
    left: spacing.lg,
    zIndex: 1,
    maxWidth: '60%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accentSoft,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  tabText: {
    color: colors.navy800,
    flexShrink: 1,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.glassLight,
    borderRadius: radius.md,
    borderTopLeftRadius: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  meta: {
    alignItems: 'flex-end',
  },
  // Amount colors keep at least 3:1 on glassLight; the accent stays on the icon tab.
  in: {
    color: colors.navy700,
  },
  out: {
    color: colors.textOnLightMuted,
  },
});
