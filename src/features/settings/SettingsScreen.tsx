import Constants from 'expo-constants';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { useTabBarClearance } from '@/src/components/navigation/tabBarLayout';
import { AppText, Icon, NavyCard, Screen } from '@/src/components/ui';
import { type Currency, type Language } from '@/src/config/locale';
import { HOLDER_NAME_MAX_LENGTH, useAppStore } from '@/src/store/useAppStore';
import { colors, font, layout } from '@/src/theme';

import { SegmentedControl, type SegmentedOption } from './SegmentedControl';
import { SwitchRow } from './SwitchRow';

const CURRENCY_ORDER: Currency[] = ['EUR', 'XOF', 'USD'];
const LANGUAGE_ORDER: Language[] = ['fr', 'en'];

function Label({ children, first = false }: { children: React.ReactNode; first?: boolean }) {
  return <AppText style={first ? styles.labelFirst : styles.label}>{children}</AppText>;
}

export function SettingsScreen() {
  const { t } = useTranslation('settings');
  const currency = useAppStore((state) => state.currency);
  const language = useAppStore((state) => state.language);
  const holderName = useAppStore((state) => state.holderName);
  const repeatAnnouncement = useAppStore((state) => state.repeatAnnouncement);
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

  // i18next follows the store through useLanguageSync in the root layout.
  const changeLanguage = (next: Language) => useAppStore.getState().setLanguage(next);

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

  const holderValue = holderDraft ?? holderName;

  return (
    <Screen testID="screen-settings">
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomClearance }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="h2" style={styles.title}>
          {t('title')}
        </AppText>

        <NavyCard contentStyle={styles.panel}>
          <Label first>{t('currency.title')}</Label>
          <SegmentedControl
            testID="settings-currency"
            options={currencyOptions}
            value={currency}
            onChange={(next) => useAppStore.getState().setCurrency(next)}
          />

          <Label>{t('language.title')}</Label>
          <SegmentedControl
            testID="settings-language"
            options={languageOptions}
            value={language}
            onChange={changeLanguage}
          />

          <Label>{t('holder.title')}</Label>
          <View style={styles.field}>
            <TextInput
              testID="settings-holder"
              value={holderValue}
              onChangeText={(text) => setHolderDraft(text.toUpperCase())}
              onBlur={commitHolder}
              onSubmitEditing={commitHolder}
              maxLength={HOLDER_NAME_MAX_LENGTH}
              autoCapitalize="characters"
              autoCorrect={false}
              accessibilityLabel={t('holder.title')}
              accessibilityHint={t('holder.hint')}
              placeholder={t('holder.placeholder')}
              placeholderTextColor={colors.textOnDarkMuted}
              style={styles.input}
            />
            <AppText style={styles.small} testID="settings-holder-count">
              {`${holderValue.length} / ${HOLDER_NAME_MAX_LENGTH}`}
            </AppText>
          </View>

          <SwitchRow
            testID="settings-repeat"
            label={t('repeat.title')}
            hint={t('repeat.hint')}
            help={t('repeat.help')}
            value={repeatAnnouncement}
            onChange={(next) => useAppStore.getState().setRepeatAnnouncement(next)}
          />

          <Pressable
            testID="settings-reset"
            accessibilityRole="button"
            accessibilityHint={t('reset.description')}
            onPress={confirmReset}
            style={styles.resetButton}
          >
            <Icon name="trash" size={18} color={colors.warning} />
            <AppText style={styles.resetText}>{t('reset.button')}</AppText>
          </Pressable>
        </NavyCard>

        <NavyCard contentStyle={styles.about}>
          <View style={styles.aboutHeader}>
            <Icon name="info" size={16} color={colors.textOnDarkMuted} />
            <AppText style={styles.aboutTitle}>{t('about.title')}</AppText>
          </View>
          <AppText style={styles.aboutText}>{t('about.text')}</AppText>
          <AppText style={[styles.small, styles.version]} testID="settings-version">
            {t('about.version', { version })}
          </AppText>
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
    paddingTop: 6,
    paddingHorizontal: 4,
    color: colors.navy800,
  },
  panel: {
    padding: 20,
    gap: 10,
  },
  // Line heights and margins calibrated against the mockup capture (web line-height drift).
  labelFirst: {
    ...font(12, 'semiBold'),
    lineHeight: 16,
    color: colors.textOnDarkMuted,
    marginTop: 8,
  },
  label: {
    ...font(12, 'semiBold'),
    lineHeight: 16,
    color: colors.textOnDarkMuted,
    marginTop: 6.5,
  },
  field: {
    height: 50,
    borderRadius: 16,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: '100%',
    ...font(15, 'semiBold'),
    letterSpacing: 1,
    color: colors.textOnDark,
  },
  small: {
    ...font(12.5, 'regular'),
    color: colors.textOnDarkMuted,
  },
  version: {
    marginTop: 7,
    marginBottom: 10.5,
  },
  resetButton: {
    marginTop: 8,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.warning,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resetText: {
    ...font(15, 'semiBold'),
    color: colors.warning,
  },
  about: {
    paddingTop: 18,
    paddingHorizontal: 20,
    gap: 6,
  },
  aboutHeader: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aboutTitle: {
    ...font(12, 'semiBold'),
    color: colors.textOnDarkMuted,
  },
  aboutText: {
    ...font(14, 'regular'),
    lineHeight: 21,
    color: 'rgba(255,255,255,0.88)',
  },
});
