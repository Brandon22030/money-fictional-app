import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/src/components/ui/AppText';
import type { Currency, Language } from '@/src/config/locale';
import { colors, radius, spacing } from '@/src/theme';
import { announceBalance, stopAnnouncement } from '@/src/services/voice';

export type VoiceButtonProps = {
  amountMinor: number;
  currency: Currency;
  language: Language;
  variant?: 'glass' | 'tile';
  testID?: string;
};

export function VoiceButton({
  amountMinor,
  currency,
  language,
  variant = 'glass',
  testID,
}: VoiceButtonProps) {
  const { t } = useTranslation('voice');
  const [speaking, setSpeaking] = useState(false);
  const mounted = useRef(true);
  // Each press gets an id: only the latest announcement may reset `speaking` when it ends.
  const callId = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      callId.current += 1;
      void stopAnnouncement();
    };
  }, []);

  const onPress = useCallback(() => {
    const id = callId.current + 1;
    callId.current = id;
    if (speaking) {
      setSpeaking(false);
      void stopAnnouncement();
      return;
    }
    setSpeaking(true);
    void announceBalance({ amountMinor, currency, language, t }).finally(() => {
      if (mounted.current && callId.current === id) setSpeaking(false);
    });
  }, [speaking, amountMinor, currency, language, t]);

  const label = speaking ? t('stop') : t('listen');
  const isTile = variant === 'tile';
  const tone = isTile ? colors.navy800 : colors.textOnDark;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: speaking }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isTile ? styles.tile : styles.glass,
        pressed ? styles.pressed : null,
      ]}
    >
      <Feather name={speaking ? 'square' : 'volume-2'} size={20} color={tone} />
      <AppText variant="caption" tone={isTile ? 'onLight' : 'onDark'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  glass: {
    backgroundColor: colors.glassFill,
    borderColor: colors.glassBorder,
  },
  tile: {
    backgroundColor: colors.glassLight,
    borderColor: colors.glassBorder,
  },
  pressed: {
    opacity: 0.7,
  },
});
