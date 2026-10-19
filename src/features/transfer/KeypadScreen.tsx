import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { NumericKeypad } from "@/src/components/keypad/NumericKeypad";
import { useAmountInput } from "@/src/components/keypad/useAmountInput";
import { AppText, Screen } from "@/src/components/ui";
import { CURRENCIES } from "@/src/config/locale";
import { findFavorite } from "@/src/data/favorites";
import type { IntentionKind } from "@/src/domain/types";
import { useAppStore } from "@/src/store/useAppStore";
import { colors, radius, spacing } from "@/src/theme";

export type KeypadMode = "set" | IntentionKind;

const MODES: KeypadMode[] = ["set", "receive", "send", "pay", "withdraw"];

function parseMode(value: string | string[] | undefined): KeypadMode {
  const raw = Array.isArray(value) ? value[0] : value;
  return MODES.find((mode) => mode === raw) ?? "set";
}

function firstParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ? raw : undefined;
}

export function KeypadScreen() {
  const { t } = useTranslation("transfer");
  const { t: tKeypad } = useTranslation("keypad");
  const { t: tCommon } = useTranslation("common");
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; contact?: string }>();

  const mode = parseMode(params.mode);
  // Only known favorites count as contacts: free text from a deep link is ignored.
  const favorite = findFavorite(firstParam(params.contact));
  const contactName = favorite ? t(favorite.nameKey) : undefined;

  const currency = useAppStore((state) => state.currency);
  const balanceMinor = useAppStore((state) => state.balanceMinor);
  const setBalance = useAppStore((state) => state.setBalance);
  const applyIntention = useAppStore((state) => state.applyIntention);

  const { display, minor, press } = useAmountInput({
    currency,
    initialMinor: mode === "set" ? balanceMinor : 0,
    decimalSeparator: tKeypad("separator"),
  });
  const [insufficient, setInsufficient] = useState(false);

  const close = () => {
    if (router.canGoBack()) router.back();
  };

  const onKey = (key: Parameters<typeof press>[0]) => {
    setInsufficient(false);
    press(key);
  };

  const onValidate = () => {
    if (minor <= 0) return;
    if (mode === "set") {
      setBalance(minor);
      close();
      return;
    }
    const result = applyIntention(
      mode,
      minor,
      favorite
        ? {
            labelKey: "content:intentions.sharedWith",
            labelParams: { contact: favorite.id },
          }
        : undefined,
    );
    if (result.ok) {
      close();
    } else if (result.reason === "insufficient") {
      setInsufficient(true);
    }
  };

  const disabled = minor <= 0;

  return (
    <Screen testID="screen-keypad" style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          testID="keypad-close"
          accessibilityRole="button"
          accessibilityLabel={t("close")}
          onPress={close}
          style={styles.close}
        >
          <Feather name="x" size={22} color={colors.navy800} />
        </Pressable>
      </View>

      <View style={styles.titles}>
        <AppText variant="title" testID="keypad-title">
          {t(`modes.${mode}.title`)}
        </AppText>
        <AppText variant="body" tone="onLightMuted" testID="keypad-subtitle">
          {t(`modes.${mode}.subtitle`)}
        </AppText>
        {contactName ? (
          <AppText variant="bodyStrong" testID="keypad-contact">
            {t("contact", { name: contactName })}
          </AppText>
        ) : null}
      </View>

      <View style={styles.amountRow}>
        <AppText variant="display" tabular testID="keypad-amount">
          {display}
        </AppText>
        <AppText variant="title" tone="onLightMuted">
          {` ${CURRENCIES[currency].symbol}`}
        </AppText>
      </View>

      <View style={styles.messageSlot}>
        {insufficient ? (
          <AppText
            variant="body"
            tone="onLightMuted"
            testID="keypad-insufficient"
            style={styles.message}
          >
            {t("insufficient")}
          </AppText>
        ) : null}
      </View>

      <NumericKeypad
        testID="keypad"
        onKey={onKey}
        decimalEnabled={CURRENCIES[currency].decimals > 0}
      />

      <Pressable
        testID="keypad-validate"
        accessibilityRole="button"
        accessibilityLabel={t("validate")}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onValidate}
        style={[styles.validate, disabled ? styles.validateDisabled : null]}
      >
        <AppText variant="bodyStrong" tone="onDark">
          {t("validate")}
        </AppText>
      </Pressable>
      <AppText variant="caption" tone="onLightMuted" style={styles.notice}>
        {tCommon("simulationNotice")}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: spacing["2xl"],
    paddingBottom: spacing["3xl"],
    gap: spacing.lg,
  },
  header: {
    alignItems: "flex-end",
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.glassLight,
  },
  titles: {
    alignItems: "center",
    gap: spacing.xs,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  messageSlot: {
    minHeight: 44,
    justifyContent: "center",
  },
  message: {
    textAlign: "center",
  },
  validate: {
    height: 56,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.navy800,
  },
  validateDisabled: {
    opacity: 0.4,
  },
  notice: {
    textAlign: "center",
  },
});
