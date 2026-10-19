import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';

import { RingGauge, type RingSegment } from '@/src/components/charts/RingGauge';
import { StackedBarChart } from '@/src/components/charts/StackedBarChart';
import { AppText, NavyCard, Screen } from '@/src/components/ui';
import { formatCompact, getLocaleTag } from '@/src/domain/money';
import { INTENTION_KINDS, monthlyTotals, shareByKind } from '@/src/domain/stats';
import type { IntentionKind } from '@/src/domain/types';
import { useAllTransactions } from '@/src/store/selectors';
import { useAppStore } from '@/src/store/useAppStore';
import { colors, spacing } from '@/src/theme';

const KIND_STYLE: Record<IntentionKind, Pick<RingSegment, 'color' | 'icon'>> = {
  receive: { color: colors.accent, icon: 'arrow-down-left' },
  send: { color: colors.accentSoft, icon: 'arrow-up-right' },
  pay: { color: colors.slateBar, icon: 'shopping-bag' },
  withdraw: { color: colors.navy700, icon: 'log-out' },
};

const SCROLL_BOTTOM_PADDING = 120;

export function AbundanceScreen() {
  const { t } = useTranslation('abundance');
  const transactions = useAllTransactions();
  const balanceMinor = useAppStore((state) => state.balanceMinor);
  const currency = useAppStore((state) => state.currency);
  const language = useAppStore((state) => state.language);

  const segments = useMemo<RingSegment[]>(() => {
    const shares = shareByKind(transactions);
    return INTENTION_KINDS.map((kind) => ({
      key: kind,
      label: t(`kinds.${kind}`),
      value: shares.find((share) => share.kind === kind)?.amountMinor ?? 0,
      ...KIND_STYLE[kind],
    }));
  }, [transactions, t]);

  const bars = useMemo(() => {
    const monthFormat = new Intl.DateTimeFormat(getLocaleTag(language), { month: 'short' });
    return monthlyTotals(transactions, new Date()).map((total) => {
      const [year, month] = total.month.split('-').map(Number);
      return {
        label: monthFormat.format(new Date(year, month - 1, 1)).replace('.', ''),
        a: total.inMinor,
        b: total.outMinor,
      };
    });
  }, [transactions, language]);

  return (
    <Screen testID="screen-abundance">
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="h2">{t('title')}</AppText>
        <NavyCard testID="abundance-ring" contentStyle={styles.ring}>
          <RingGauge
            segments={segments}
            centerLabel={formatCompact(balanceMinor, currency, language)}
            centerCaption={t('balanceCaption')}
          />
        </NavyCard>
        <NavyCard testID="abundance-bars">
          <AppText variant="title" tone="onDark" style={styles.barsTitle}>
            {t('barsTitle')}
          </AppText>
          <StackedBarChart
            data={bars}
            legend={{ a: t('legend.received'), b: t('legend.given') }}
          />
        </NavyCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: SCROLL_BOTTOM_PADDING,
    gap: spacing.xl,
  },
  ring: {
    alignItems: 'center',
  },
  barsTitle: {
    marginBottom: spacing.md,
  },
});
