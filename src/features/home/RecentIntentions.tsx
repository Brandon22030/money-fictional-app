import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui';
import { TransactionTicket, type FeatherIconName } from '@/src/components/transactions/TransactionTicket';
import { transactionTitle } from '@/src/data/transactionTitle';
import { formatMoney } from '@/src/domain/money';
import type { IntentionKind } from '@/src/domain/types';
import { useAllTransactions } from '@/src/store/selectors';
import { useAppStore } from '@/src/store/useAppStore';
import { spacing } from '@/src/theme';

const RECENT_COUNT = 5;

const KIND_ICONS: Record<IntentionKind, FeatherIconName> = {
  receive: 'arrow-down-left',
  send: 'arrow-up-right',
  pay: 'credit-card',
  withdraw: 'download',
};

export function RecentIntentions() {
  const { t } = useTranslation('home');
  const router = useRouter();
  const transactions = useAllTransactions();
  const currency = useAppStore((state) => state.currency);
  const language = useAppStore((state) => state.language);
  const recent = transactions.slice(0, RECENT_COUNT);

  return (
    <View>
      <View style={styles.header}>
        <AppText variant="bodyStrong">{t('recent')}</AppText>
        <Pressable
          testID="home-see-all"
          accessibilityRole="link"
          onPress={() => router.push('/history')}
        >
          <AppText variant="caption" tone="onLightMuted">
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
          {recent.map((tx) => (
            <TransactionTicket
              key={tx.id}
              testID={`home-tx-${tx.id}`}
              title={transactionTitle(tx, t)}
              amountLabel={formatMoney(tx.amountMinor, currency, language).full}
              direction={tx.kind === 'receive' ? 'in' : 'out'}
              date={new Date(tx.createdAt)}
              locale={language}
              icon={KIND_ICONS[tx.kind]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
});
