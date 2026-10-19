import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionList, StyleSheet, TextInput, View } from 'react-native';

import { useTabBarClearance } from '@/src/components/navigation/tabBarLayout';
import { TransactionTicket } from '@/src/components/transactions/TransactionTicket';
import { AppText, Icon, Screen } from '@/src/components/ui';
import { transactionTitle } from '@/src/data/transactionTitle';
import { getLocaleTag, formatMoney } from '@/src/domain/money';
import { useAllTransactions } from '@/src/store/selectors';
import { useAppStore } from '@/src/store/useAppStore';
import { colors, font, spacing } from '@/src/theme';

import { filterEntries, groupByDay, type TransactionEntry } from './historyData';

const ROW_GAP = 14;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function HistoryScreen() {
  const { t } = useTranslation('history');
  const transactions = useAllTransactions();
  const currency = useAppStore((state) => state.currency);
  const language = useAppStore((state) => state.language);
  const [query, setQuery] = useState('');
  const bottomClearance = useTabBarClearance();

  const entries = useMemo<TransactionEntry[]>(
    () =>
      transactions.map((transaction) => ({
        transaction,
        title: transactionTitle(transaction, t),
        amountLabel: formatMoney(transaction.amountMinor, currency, language).full,
      })),
    [transactions, currency, language, t],
  );

  const sections = useMemo(() => groupByDay(filterEntries(entries, query)), [entries, query]);
  const dayFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(getLocaleTag(language), {
        day: 'numeric',
        month: 'long',
      }),
    [language],
  );

  const dayTitle = (date: Date) => {
    const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);
    if (diffDays === 0) return t('today');
    if (diffDays === 1) return t('yesterday');
    return dayFormat.format(date);
  };

  return (
    <Screen testID="screen-history">
      <View style={styles.header}>
        <AppText variant="h2" style={styles.title}>
          {t('title')}
        </AppText>
        <View style={styles.search}>
          <Icon name="search" size={20} color={colors.textOnLightMuted} />
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
        contentContainerStyle={[styles.list, { paddingBottom: bottomClearance }]}
        renderSectionHeader={({ section }) => (
          <AppText style={styles.day}>{dayTitle(section.date)}</AppText>
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
              kind={item.transaction.kind}
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
    gap: ROW_GAP,
  },
  title: {
    paddingTop: 7.5,
    paddingHorizontal: 4,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.glassLight,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
    paddingHorizontal: 18,
    height: 50,
  },
  input: {
    flex: 1,
    ...font(15, 'regular'),
    color: colors.textOnLight,
    paddingVertical: 0,
  },
  list: {
    paddingHorizontal: spacing.xl,
  },
  day: {
    ...font(14, 'bold'),
    color: colors.navy800,
    marginTop: ROW_GAP + 2,
  },
  item: {
    marginTop: ROW_GAP,
  },
  empty: {
    textAlign: 'center',
    marginTop: spacing['3xl'],
  },
});
