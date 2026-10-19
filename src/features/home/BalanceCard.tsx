import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AmountText, AppText, Icon, NavyCard, Pill, type IconName } from '@/src/components/ui';
import { VoiceButton } from '@/src/components/voice/VoiceButton';
import { getVisualFixture } from '@/src/dev/visualFixture';
import { dailyDelta } from '@/src/domain/stats';
import { CURRENCIES, type Currency, type Language } from '@/src/config/locale';
import { formatMoney, getLocaleTag } from '@/src/domain/money';
import { useBalanceParts } from '@/src/store/selectors';
import { useAppStore } from '@/src/store/useAppStore';
import { colors, font } from '@/src/theme';

const NBSP = '\u00A0';
const NARROW_NBSP = /\u202F/g;

type ActionButtonProps = {
  testID: string;
  icon: IconName;
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
      <Icon name={icon} size={24} color={colors.textOnDark} />
      <AppText variant="caption" tone="onDark" style={styles.actionLabel}>
        {label}
      </AppText>
    </Pressable>
  );
}

/**
 * Signed daily amount without decimals, rounded to the nearest unit. The sign follows the
 * rounded value, so an amount that rounds to zero reads "+0", never "-0".
 */
export function signedWholeUnits(minor: number, currency: Currency, language: Language): string {
  const scale = 10 ** CURRENCIES[currency].decimals;
  const roundedAbs = Math.round(Math.abs(minor) / scale) * scale;
  const sign = minor < 0 && roundedAbs > 0 ? '-' : '+';
  const parts = formatMoney(roundedAbs, currency, language);
  const integer = parts.integer.replace(NARROW_NBSP, NBSP);
  return `${sign}${parts.suffix ? `${integer}${NBSP}${parts.suffix}` : integer}`;
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
    () => getVisualFixture()?.dailyDelta ?? dailyDelta(userTransactions, balanceMinor, new Date()),
    [userTransactions, balanceMinor],
  );
  const percentFormat = useMemo(
    () =>
      new Intl.NumberFormat(getLocaleTag(language), {
        style: 'percent',
        signDisplay: 'always',
        maximumFractionDigits: 2,
      }),
    [language],
  );
  const percentLabel = percentFormat.format(delta.percent / 100);
  const amountLabel = signedWholeUnits(delta.amountMinor, currency, language);

  return (
    <NavyCard contentStyle={styles.card}>
      <View testID="home-balance-label-row" style={styles.labelRow}>
        <AppText variant="caption" tone="onDarkMuted" style={styles.label}>
          {t('balanceLabel')}
        </AppText>
        <AppText
          variant="caption"
          tone="onDarkMuted"
          testID="home-fictional-notice"
          style={styles.notice}
        >
          {t('fictionalBalance')}
        </AppText>
      </View>
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
      <View style={styles.pills}>
        <Pill
          testID="home-delta-percent"
          label={percentLabel}
          icon={delta.amountMinor < 0 ? 'down' : 'up'}
          color={colors.accentSoft}
          style={styles.pill}
        />
        <Pill
          testID="home-delta-amount"
          label={`${amountLabel} ${t('today')}`}
          style={styles.pill}
        />
      </View>
      <View style={styles.actions}>
        <ActionButton
          testID="home-receive"
          icon="down"
          label={t('receive')}
          onPress={() => router.push({ pathname: '/keypad', params: { mode: 'receive' } })}
        />
        <ActionButton
          testID="home-send"
          icon="send"
          label={t('send')}
          onPress={() => router.push({ pathname: '/keypad', params: { mode: 'send' } })}
        />
        <VoiceButton testID="home-voice" />
      </View>
    </NavyCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 22,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...font(13, 'medium'),
  },
  notice: {
    ...font(11, 'semiBold'),
    letterSpacing: 0.4,
  },
  amount: {
    marginTop: 4,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  // The mockup pill measures 31 px: its 16.4 px line box rounds up where RN rounds the line height down.
  pill: {
    paddingVertical: 6.5,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  action: {
    flex: 1,
    height: 76,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  actionLabel: {
    ...font(12, 'semiBold'),
  },
  pressed: {
    opacity: 0.7,
  },
});
