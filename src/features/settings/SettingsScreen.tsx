import Constants from 'expo-constants';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { useTabBarClearance } from '@/src/components/navigation/tabBarLayout';
import { AppText, Screen } from '@/src/components/ui';
import { type Currency, type Language } from '@/src/config/locale';
import i18n from '@/src/i18n';
import { HOLDER_NAME_MAX_LENGTH, useAppStore } from '@/src/store/useAppStore';
import { colors, radius, spacing } from '@/src/theme';

import { SegmentedControl, type SegmentedOption } from './SegmentedControl';

const CURRENCY_ORDER: Currency[] = ['EUR', 'XOF', 'USD'];
const LANGUAGE_ORDER: Language[] = ['fr', 'en'];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="bodyStrong" tone="onLightMuted">
        {title}
      </AppText>
      {children}
    </View>
  );
}

export function SettingsScreen() {
  const { t } = useTranslation('settings');
  const currency = useAppStore((state) => state.currency);
  const language = useAppStore((state) => state.language);
  const holderName = useAppStore((state) => state.holderName);
  const [holderDraft, setHolderDraft] = useState<string | null>(null);
  const bottomClearance = useTabBarClearance();

  const currencyOptions: SegmentedOption<Currency>[] = CURRENCY_ORDER.map((value) => ({
    value,
    label: t(`currency.${value}`),
  }));
  const languageOptions: SegmentedOption<Language>[] = LANGUAGE_ORDER.map((value) => ({
    value,
    label: t(`language.${value}`),
  }));

  const changeLanguage = (next: Language) => {
    useAppStore.getState().setLanguage(next);
    void i18n.changeLanguage(next);
  };

  const commitHolder = () => {
    if (holderDraft !== null) useAppStore.getState().setHolderName(holderDraft);
    setHolderDraft(null);
  };

  const confirmReset = () => {
    Alert.alert(t('reset.confirmTitle'), t('reset.confirmMessage'), [
      { text: t('reset.cancel'), style: 'cancel' },
      {
        text: t('reset.confirm'),
        style: 'destructive',
        onPress: () => useAppStore.getState().resetAll(),
      },
    ]);
  };

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen testID="screen-settings">
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomClearance }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="h2">{t('title')}</AppText>

        <Section title={t('currency.title')}>
          <SegmentedControl
            testID="settings-currency"
            options={currencyOptions}
            value={currency}
            onChange={(next) => useAppStore.getState().setCurrency(next)}
          />
        </Section>

        <Section title={t('language.title')}>
          <SegmentedControl
            testID="settings-language"
            options={languageOptions}
            value={language}
            onChange={changeLanguage}
          />
        </Section>

        <Section title={t('holder.title')}>
          <TextInput
            testID="settings-holder"
            value={holderDraft ?? holderName}
            onChangeText={(text) => setHolderDraft(text.toUpperCase())}
            onBlur={commitHolder}
            onSubmitEditing={commitHolder}
            maxLength={HOLDER_NAME_MAX_LENGTH}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder={t('holder.placeholder')}
            placeholderTextColor={colors.textOnLightMuted}
            style={styles.input}
          />
          <AppText variant="caption" tone="onLightMuted">
            {t('holder.hint')}
          </AppText>
        </Section>

        <Section title={t('reset.button')}>
          <AppText variant="caption" tone="onLightMuted">
            {t('reset.description')}
          </AppText>
          <Pressable
            testID="settings-reset"
            accessibilityRole="button"
            onPress={confirmReset}
            style={styles.resetButton}
          >
            <AppText variant="bodyStrong" tone="onDark">
              {t('reset.button')}
            </AppText>
          </Pressable>
        </Section>

        <Section title={t('about.title')}>
          <AppText variant="body" tone="onLight">
            {t('about.text')}
          </AppText>
          <AppText variant="caption" tone="onLightMuted" testID="settings-version">
            {t('about.version', { version })}
          </AppText>
        </Section>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    gap: spacing['2xl'],
  },
  section: {
    gap: spacing.sm,
  },
  input: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.glassLight,
    color: colors.textOnLight,
    fontSize: 15,
    letterSpacing: 1,
  },
  resetButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.navy800,
  },
});
