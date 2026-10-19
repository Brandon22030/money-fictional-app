import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui/AppText';
import { Icon } from '@/src/components/ui/Icon';
import type { Currency, Language } from '@/src/config/locale';
import { colors, font, glass, shadows } from '@/src/theme';
import { announceBalance, stopAnnouncement } from '@/src/services/voice';

export type VoiceButtonProps = {
  amountMinor: number;
  currency: Currency;
  language: Language;
  variant?: 'action' | 'tile';
  testID?: string;
};

export function VoiceButton({
  amountMinor,
  currency,
  language,
  variant = 'action',
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
  const iconColor = isTile ? colors.accentSoft : colors.textOnDark;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: speaking }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isTile ? styles.tile : styles.action,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.content}>
        {isTile ? (
          <LinearGradient
            colors={glass.colors}
            start={glass.start}
            end={glass.end}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        {speaking ? (
          <Feather name="square" size={24} color={iconColor} />
        ) : (
          <Icon name="volume" size={24} color={iconColor} />
        )}
        <AppText variant="caption" tone="onDark" style={styles.label}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

// The tile shadow lives on the unclipped Pressable, the clipping and gradient on the inner view.
const styles = StyleSheet.create({
  base: {
    flex: 1,
    borderRadius: 22,
  },
  action: {
    height: 76,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: glass.borderColor,
  },
  tile: {
    height: 84,
    backgroundColor: glass.colors[0],
    ...shadows.tile,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: glass.borderColor,
  },
  label: {
    ...font(12, 'semiBold'),
  },
  pressed: {
    opacity: 0.7,
  },
});
