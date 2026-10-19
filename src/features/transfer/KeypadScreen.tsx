import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { NumericKeypad } from '@/src/components/keypad/NumericKeypad';
import { useAmountInput } from '@/src/components/keypad/useAmountInput';
import {
  AmountText,
  AppText,
  Icon,
  NavyCard,
  Screen,
} from '@/src/components/ui';
import { CURRENCIES } from '@/src/config/locale';
import { findFavorite } from '@/src/data/favorites';
import { formatMoney } from '@/src/domain/money';
import type { IntentionKind } from '@/src/domain/types';
import { useAppStore } from '@/src/store/useAppStore';
import { colors, font, layout } from '@/src/theme';

export type KeypadMode = 'set' | IntentionKind;

type Notice = 'insufficient' | 'tooLarge';

const MODES: KeypadMode[] = ['set', 'receive', 'send', 'pay', 'withdraw'];

function parseMode(value: string | string[] | undefined): KeypadMode {
  const raw = Array.isArray(value) ? value[0] : value;
  return MODES.find((mode) => mode === raw) ?? 'set';
}

function firstParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ? raw : undefined;
}

export function KeypadScreen() {
  const { t } = useTranslation('transfer');
  const { t: tKeypad } = useTranslation('keypad');
  const { t: tCommon } = useTranslation('common');
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; contact?: string }>();

  const mode = parseMode(params.mode);
  // Only known favorites count as contacts: free text from a deep link is ignored.
  const favorite = findFavorite(firstParam(params.contact));
  const contactName = favorite ? t(favorite.nameKey) : undefined;

  const currency = useAppStore((state) => state.currency);
  const language = useAppStore((state) => state.language);
  const balanceMinor = useAppStore((state) => state.balanceMinor);
  const setBalance = useAppStore((state) => state.setBalance);
  const applyIntention = useAppStore((state) => state.applyIntention);

  const { minor, press } = useAmountInput({
    currency,
    initialMinor: mode === 'set' ? balanceMinor : 0,
    decimalSeparator: tKeypad('separator'),
  });
  const [notice, setNotice] = useState<Notice | null>(null);

  // Opened from a deep link there is nothing to go back to: land on Home.
  const close = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const onKey = (key: Parameters<typeof press>[0]) => {
    setNotice(null);
    press(key);
  };

  // A balance of zero is a valid choice; an intention needs a positive amount.
  const disabled = mode === 'set' ? false : minor <= 0;

  const onValidate = () => {
    if (disabled) return;
    if (mode === 'set') {
      setBalance(minor);
      close();
      return;
    }
    const result = applyIntention(
      mode,
      minor,
      favorite
        ? {
            labelKey: 'content:intentions.sharedWith',
            labelParams: { contact: favorite.id },
          }
        : undefined,
    );
    if (result.ok) {
      close();
    } else {
      setNotice(result.reason === 'insufficient' ? 'insufficient' : 'tooLarge');
    }
  };

  const money = formatMoney(minor, currency, language);
  const available = formatMoney(balanceMinor, currency, language).full;

  return (
    <Screen testID="screen-keypad" style={styles.screen}>
      <Pressable
        testID="keypad-close"
        accessibilityRole="button"
        accessibilityLabel={t('close')}
        onPress={close}
        style={styles.handleTarget}
      >
        <View style={styles.handle} />
      </Pressable>

      <AppText variant="h2" style={styles.title} testID="keypad-title">
        {t(`modes.${mode}.title`)}
      </AppText>
      {contactName ? (
        <Text
          testID="keypad-contact"
          accessibilityLabel={t('contact', { name: contactName })}
          style={styles.subtitle}
        >
          {`${t('contactPrefix')} `}
          <Text style={styles.subtitleName}>{contactName}</Text>
        </Text>
      ) : (
        <Text testID="keypad-subtitle" style={styles.subtitle}>
          {t(`modes.${mode}.subtitle`)}
        </Text>
      )}

      {/* The card fills the free height (as in the mockup) and scrolls when the window or
          the modal sheet is too short for it, so Valider always stays reachable. */}
      <ScrollView
        testID="keypad-scroll"
        style={styles.cardSlot}
        contentContainerStyle={styles.cardScroll}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={false}
      >
        <NavyCard fill contentStyle={styles.card}>
          <AmountText
            testID="keypad-amount"
            integer={money.integer}
            decimals={money.decimals}
            suffix={money.suffix}
            size={52}
            style={styles.amount}
          />
          {mode === 'set' ? null : (
            <AppText
              tone="onDarkMuted"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
              style={styles.available}
            >
              {t('available', { amount: available })}
            </AppText>
          )}

          <NumericKeypad
            testID="keypad"
            onKey={onKey}
            decimalEnabled={CURRENCIES[currency].decimals > 0}
          />

          <Pressable
            testID="keypad-validate"
            accessibilityRole="button"
            accessibilityLabel={t('validate')}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onValidate}
            style={[styles.validate, disabled ? styles.validateDisabled : null]}
          >
            <Icon name="check" size={20} color={colors.navy900} />
            <Text style={styles.validateLabel}>{t('validate')}</Text>
          </Pressable>

          {notice ? (
            <AppText
              tone="onDark"
              testID={
                notice === 'insufficient'
                  ? 'keypad-insufficient'
                  : 'keypad-too-large'
              }
              accessibilityLiveRegion="polite"
              style={styles.message}
            >
              {t(notice)}
            </AppText>
          ) : null}
          <Text style={styles.notice}>{tCommon('simulationNotice')}</Text>
        </NavyCard>
      </ScrollView>
    </Screen>
  );
}

// Minimum touch target (iOS HIG / Material) for the close handle.
const HANDLE_TARGET = 44;
const HANDLE_HEIGHT = 5;
// Room around the card inside the scroll view so its shadow is not clipped. The scroll view
// spreads by the same amounts over the screen padding and the gap above (up to the subtitle,
// where scrolled content is clipped), so the card keeps its place.
const SCREEN_BOTTOM = 28;
const CARD_BOTTOM_GAP = 6;
const SUBTITLE_GAP = 4;
const CARD_SHADOW_TOP = layout.gap + SUBTITLE_GAP;

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: layout.screenX,
    paddingBottom: SCREEN_BOTTOM,
    gap: layout.gap,
  },
  // 44 pt square-ish target centred on the 5 pt bar; negative margins keep the bar where it was.
  handleTarget: {
    alignSelf: 'center',
    width: HANDLE_TARGET * 2,
    height: HANDLE_TARGET,
    marginTop: 2 - (HANDLE_TARGET - HANDLE_HEIGHT) / 2,
    marginBottom: 6 - (HANDLE_TARGET - HANDLE_HEIGHT) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 44,
    height: HANDLE_HEIGHT,
    borderRadius: 3,
    backgroundColor: 'rgba(15,42,85,0.35)',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    ...font(14, 'regular'),
    textAlign: 'center',
    color: colors.navy700,
    marginBottom: SUBTITLE_GAP,
  },
  subtitleName: {
    ...font(14, 'bold'),
  },
  cardSlot: {
    flex: 1,
    marginHorizontal: -layout.screenX,
    marginTop: -CARD_SHADOW_TOP,
    marginBottom: -SCREEN_BOTTOM,
  },
  cardScroll: {
    flexGrow: 1,
    paddingHorizontal: layout.screenX,
    paddingTop: CARD_SHADOW_TOP,
    paddingBottom: SCREEN_BOTTOM + CARD_BOTTOM_GAP,
  },
  card: {
    paddingVertical: 22,
    paddingHorizontal: 20,
    gap: 12,
  },
  amount: {
    alignItems: 'center',
  },
  available: {
    ...font(12, 'regular'),
    textAlign: 'center',
  },
  validate: {
    height: 58,
    borderRadius: 29,
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  validateDisabled: {
    opacity: 0.4,
  },
  validateLabel: {
    ...font(16, 'bold'),
    color: colors.navy900,
  },
  message: {
    textAlign: 'center',
  },
  notice: {
    ...font(11, 'semiBold'),
    textAlign: 'center',
    color: colors.textOnDarkMuted,
  },
});
