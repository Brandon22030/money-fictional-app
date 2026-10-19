import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionList, StyleSheet, TextInput, View } from 'react-native';

import { TransactionTicket, type FeatherIconName } from '@/src/components/transactions/TransactionTicket';
import { AppText, Screen } from '@/src/components/ui';
import { getLocaleTag, formatMoney } from '@/src/domain/money';
import type { IntentionKind } from '@/src/domain/types';
import { useAllTransactions } from '@/src/store/selectors';
import { useAppStore } from '@/src/store/useAppStore';
import { colors, fontFamily, fontSize, radius, spacing } from '@/src/theme';

import { filterEntries, groupByDay, type TransactionEntry } from './historyData';

const KIND_ICONS: Record<IntentionKind, FeatherIconName> = {
  receive: 'arrow-down-left',
  send: 'arrow-up-right',
  pay: 'shopping-bag',
  withdraw: 'log-out',
};

const LIST_BOTTOM_PADDING = 120;

export function HistoryScreen() {
  const { t } = useTranslation('history');
  const transactions = useAllTransactions();
  const currency = useAppStore((state) => state.currency);
  const language = useAppStore((state) => state.language);
  const [query, setQuery] = useState('');

  const entries = useMemo<TransactionEntry[]>(
    () =>
      transactions.map((transaction) => ({
        transaction,
        title: t(transaction.labelKey, transaction.labelParams),
        amountLabel: formatMoney(transaction.amountMinor, currency, language).full,
      })),
    [transactions, currency, language, t],
  );

  const sections = useMemo(() => groupByDay(filterEntries(entries, query)), [entries, query]);
  const dayFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(getLocaleTag(language), {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    [language],
  );

  return (
    <Screen testID="screen-history">
      <View style={styles.header}>
        <AppText variant="h2">{t('title')}</AppText>
        <View style={styles.search}>
          <Feather name="search" size={18} color={colors.textOnLightMuted} />
          <TextInput
            testID="history-search"
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor={colors.textOnLightMuted}
            accessibilityLabel={t('searchLabel')}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </View>
      <SectionList
        testID="history-list"
        sections={sections}
        keyExtractor={(entry) => entry.transaction.id}
        stickySectionHeadersEnabled={false}
        initialNumToRender={20}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        renderSectionHeader={({ section }) => (
          <AppText variant="bodyStrong" tone="onLightMuted" style={styles.day}>
            {dayFormat.format(section.date)}
          </AppText>
        )}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <TransactionTicket
              testID={`history-item-${item.transaction.id}`}
              title={item.title}
              amountLabel={item.amountLabel}
              direction={item.transaction.kind === 'receive' ? 'in' : 'out'}
              date={new Date(item.transaction.createdAt)}
              locale={language}
              icon={KIND_ICONS[item.transaction.kind]}
            />
          </View>
        )}
        ListEmptyComponent={
          <AppText testID="history-empty" tone="onLightMuted" style={styles.empty}>
            {t('empty')}
          </AppText>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.glassLight,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    paddingHorizontal: spacing.lg,
    height: 46,
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    color: colors.textOnLight,
    paddingVertical: 0,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: LIST_BOTTOM_PADDING,
  },
  day: {
    marginTop: spacing.md,
    textTransform: 'capitalize',
  },
  item: {
    marginTop: spacing.xs,
  },
  empty: {
    textAlign: 'center',
    marginTop: spacing['3xl'],
  },
});
