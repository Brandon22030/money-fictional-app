import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui';
import { TransactionTicket } from '@/src/components/transactions/TransactionTicket';
import { transactionTitle } from '@/src/data/transactionTitle';
import { formatMoney } from '@/src/domain/money';
import { useAllTransactions } from '@/src/store/selectors';
import { useAppStore } from '@/src/store/useAppStore';
import { colors, font, layout } from '@/src/theme';

const RECENT_COUNT = 5;

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export function RecentIntentions() {
  const { t } = useTranslation('home');
  const router = useRouter();
  const transactions = useAllTransactions();
  const currency = useAppStore((state) => state.currency);
  const language = useAppStore((state) => state.language);
  const now = new Date();
  const recent = transactions.slice(0, RECENT_COUNT);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <AppText variant="bodyStrong" style={styles.title}>
          {t('recent')}
        </AppText>
        <Pressable
          testID="home-see-all"
          accessibilityRole="link"
          onPress={() => router.push('/history')}
        >
          <AppText variant="caption" style={styles.seeAll}>
            {t('seeAll')}
          </AppText>
        </Pressable>
      </View>
      {recent.length === 0 ? (
        <AppText variant="body" tone="onLightMuted">
          {t('empty')}
        </AppText>
      ) : (
        <View style={styles.list}>
          {recent.map((tx) => {
            const date = new Date(tx.createdAt);
            return (
              <TransactionTicket
                key={tx.id}
                testID={`home-tx-${tx.id}`}
                kind={tx.kind}
                title={transactionTitle(tx, t)}
                amountLabel={formatMoney(tx.amountMinor, currency, language).full}
                direction={tx.kind === 'receive' ? 'in' : 'out'}
                date={date}
                locale={language}
                dayLabel={isSameDay(date, now) ? t('todayLabel') : undefined}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: layout.gap,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  title: {
    ...font(16, 'bold'),
    color: colors.navy800,
  },
  seeAll: {
    ...font(13, 'bold'),
    color: colors.navy700,
  },
  list: {
    gap: layout.gap,
  },
});
