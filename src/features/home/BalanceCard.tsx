import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AmountText, AppText, GlassView, NavyCard, Pill } from '@/src/components/ui';
import { VoiceButton } from '@/src/components/voice/VoiceButton';
import { dailyDelta } from '@/src/domain/stats';
import { formatMoney, getLocaleTag } from '@/src/domain/money';
import { useBalanceParts } from '@/src/store/selectors';
import { useAppStore } from '@/src/store/useAppStore';
import { colors, radius, spacing } from '@/src/theme';

type ActionButtonProps = {
  testID: string;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
};

function ActionButton({ testID, icon, label, onPress }: ActionButtonProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed ? styles.pressed : null]}
    >
      <Feather name={icon} size={20} color={colors.textOnDark} />
      <AppText variant="caption" tone="onDark">
        {label}
      </AppText>
    </Pressable>
  );
}

export function BalanceCard() {
  const { t } = useTranslation('home');
  const router = useRouter();
  const parts = useBalanceParts();
  // Only the user's own intentions move today's figures; demo data is illustrative.
  const userTransactions = useAppStore((state) => state.userTransactions);
  const balanceMinor = useAppStore((state) => state.balanceMinor);
  const currency = useAppStore((state) => state.currency);
  const language = useAppStore((state) => state.language);

  const delta = useMemo(
    () => dailyDelta(userTransactions, balanceMinor, new Date()),
    [userTransactions, balanceMinor],
  );
  const sign = delta.amountMinor < 0 ? '-' : '+';
  const percentFormat = useMemo(
    () =>
      new Intl.NumberFormat(getLocaleTag(language), {
        style: 'percent',
        signDisplay: 'always',
        maximumFractionDigits: 1,
      }),
    [language],
  );
  const percentLabel = percentFormat.format(delta.percent / 100);
  const amountLabel = `${sign}${formatMoney(Math.abs(delta.amountMinor), currency, language).full}`;

  return (
    <NavyCard>
      <AppText variant="caption" tone="onDarkMuted">
        {t('balanceLabel')}
      </AppText>
      <Pressable
        testID="home-balance"
        accessibilityRole="button"
        accessibilityHint={t('editBalance')}
        onPress={() => router.push({ pathname: '/keypad', params: { mode: 'set' } })}
        style={styles.amount}
      >
        <AmountText
          testID="home-balance-amount"
          integer={parts.integer}
          decimals={parts.decimals}
          suffix={parts.suffix}
        />
      </Pressable>
      <AppText variant="caption" tone="onDark" testID="home-fictional-notice" style={styles.notice}>
        {t('fictionalBalance')}
      </AppText>
      <View style={styles.pills}>
        <Pill testID="home-delta-percent" label={percentLabel} />
        <Pill testID="home-delta-amount" label={`${amountLabel} ${t('today')}`} />
      </View>
      <GlassView borderRadius={radius.md} style={styles.actions}>
        <ActionButton
          testID="home-receive"
          icon="arrow-down-left"
          label={t('receive')}
          onPress={() => router.push({ pathname: '/keypad', params: { mode: 'receive' } })}
        />
        <ActionButton
          testID="home-send"
          icon="arrow-up-right"
          label={t('send')}
          onPress={() => router.push({ pathname: '/keypad', params: { mode: 'send' } })}
        />
        <VoiceButton
          testID="home-voice"
          amountMinor={balanceMinor}
          currency={currency}
          language={language}
        />
      </GlassView>
    </NavyCard>
  );
}

const styles = StyleSheet.create({
  amount: {
    marginTop: spacing.xs,
  },
  notice: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    letterSpacing: 0.4,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: spacing.xs,
  },
  action: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    opacity: 0.7,
  },
});
