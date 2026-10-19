import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { RingGauge, type RingSegment } from '@/src/components/charts/RingGauge';
import { StackedBarChart } from '@/src/components/charts/StackedBarChart';
import { useTabBarClearance } from '@/src/components/navigation/tabBarLayout';
import { AppText, NavyCard, Screen } from '@/src/components/ui';
import { CURRENCIES } from '@/src/config/locale';
import { getVisualFixture } from '@/src/dev/visualFixture';
import { formatCompact, getLocaleTag } from '@/src/domain/money';
import { INTENTION_KINDS, monthlyTotals, shareByKind } from '@/src/domain/stats';
import type { IntentionKind } from '@/src/domain/types';
import { useAllTransactions } from '@/src/store/selectors';
import { useAppStore } from '@/src/store/useAppStore';
import { colors, font, layout } from '@/src/theme';

const KIND_STYLE: Record<IntentionKind, Pick<RingSegment, 'color' | 'icon'>> = {
  receive: { color: '#1B3F7A', icon: 'down' },
  send: { color: '#0F2A55', icon: 'send' },
  pay: { color: '#2A5594', icon: 'card' },
  withdraw: { color: '#163766', icon: 'up' },
};

const LEGEND_DOT: Record<IntentionKind, string> = {
  receive: colors.accent,
  send: '#4F83C2',
  pay: colors.accentSoft,
  withdraw: colors.slateBar,
};

function capitalize(text: string) {
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}

export function AbundanceScreen() {
  const { t } = useTranslation('abundance');
  const transactions = useAllTransactions();
  const balanceMinor = useAppStore((state) => state.balanceMinor);
  const currency = useAppStore((state) => state.currency);
  const language = useAppStore((state) => state.language);
  const bottomClearance = useTabBarClearance();

  const shares = useMemo<Record<IntentionKind, number>>(() => {
    const fixture = getVisualFixture();
    if (fixture) return fixture.kindShares;
    const computed = shareByKind(transactions);
    return Object.fromEntries(
      INTENTION_KINDS.map((kind) => [
        kind,
        (computed.find((share) => share.kind === kind)?.ratio ?? 0) * 100,
      ]),
    ) as Record<IntentionKind, number>;
  }, [transactions]);

  const segments = useMemo<RingSegment[]>(
    () =>
      INTENTION_KINDS.map((kind) => ({
        key: kind,
        label: t(`kinds.${kind}`),
        value: shares[kind],
        ...KIND_STYLE[kind],
      })),
    [shares, t],
  );

  const bars = useMemo(() => {
    const monthFormat = new Intl.DateTimeFormat(getLocaleTag(language), { month: 'short' });
    const fixture = getVisualFixture();
    return monthlyTotals(transactions, new Date()).map((total, index) => {
      const [year, month] = total.month.split('-').map(Number);
      const fixed = fixture?.monthly[index];
      return {
        label: capitalize(monthFormat.format(new Date(year, month - 1, 1))),
        a: fixed ? fixed.in : total.inMinor,
        b: fixed ? fixed.out : total.outMinor,
      };
    });
  }, [transactions, language]);

  return (
    <Screen testID="screen-abundance">
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomClearance }]}>
        <AppText variant="h2" style={styles.title}>
          {t('title')}
        </AppText>
        <NavyCard testID="abundance-ring" contentStyle={styles.ring}>
          <RingGauge
            segments={segments}
            centerLabel={formatCompact(balanceMinor, currency, language)}
            centerCaption={t('balanceCaption', { symbol: CURRENCIES[currency].symbol })}
          />
          <View style={styles.legend} testID="abundance-legend">
            {INTENTION_KINDS.map((kind) => (
              <View key={kind} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: LEGEND_DOT[kind] }]} />
                <AppText style={styles.legendText}>
                  {t('legendItem', { label: t(`kinds.${kind}`), percent: Math.round(shares[kind]) })}
                </AppText>
              </View>
            ))}
          </View>
        </NavyCard>
        <NavyCard testID="abundance-bars" contentStyle={styles.bars}>
          <StackedBarChart
            title={t('barsTitle')}
            data={bars}
            colors={{ a: colors.accent, b: colors.slateBar }}
            legend={{ a: t('legend.received'), b: t('legend.given') }}
          />
        </NavyCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenX,
    gap: layout.gap,
  },
  title: {
    paddingTop: 7,
    paddingHorizontal: 4,
  },
  ring: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 15,
    marginBottom: 17,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 14,
    rowGap: 10,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendText: { ...font(12, 'semiBold'), color: 'rgba(255,255,255,0.85)' },
  bars: {
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 17,
  },
});
