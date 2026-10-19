import { Feather } from '@expo/vector-icons';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui/AppText';
import { Icon } from '@/src/components/ui/Icon';
import { colors, font, glass, shadows } from '@/src/theme';
import i18n from '@/src/i18n';
import {
  announceBalance,
  stopAnnouncement,
  useIsAnnouncing,
  type AnnouncementSnapshot,
} from '@/src/services/voice';
import { useAppStore } from '@/src/store/useAppStore';

export type VoiceButtonProps = {
  variant?: 'action' | 'tile';
  testID?: string;
};

// Not the hook's `t`: the announcement can outlive this button, so it must not capture one.
const translate = (key: string, options?: Record<string, unknown>) =>
  i18n.t(`voice:${key}`, options);

function readCurrentBalance(): AnnouncementSnapshot {
  const { balanceMinor, currency, language } = useAppStore.getState();
  return { amountMinor: balanceMinor, currency, language };
}

/**
 * Starts or stops the balance announcement. The state is global (not per button), so the
 * Home and Card buttons stay in sync and a loop keeps running when the tab changes.
 */
export function VoiceButton({ variant = 'action', testID }: VoiceButtonProps) {
  const { t } = useTranslation('voice');
  const speaking = useIsAnnouncing();

  const onPress = useCallback(() => {
    if (speaking) {
      void stopAnnouncement();
      return;
    }
    void announceBalance({
      read: readCurrentBalance,
      t: translate,
      // Read at every cycle: switching the setting off (or a reset) ends a running loop.
      loop: () => useAppStore.getState().repeatAnnouncement,
    });
  }, [speaking]);

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
      <View style={[styles.content, isTile ? styles.tileContent : null]}>
        {isTile ? (
          <LinearGradient
            colors={glass.colors}
            start={glass.start}
            end={glass.end}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        {/* View wrapper: on web a bare svg would paint under the absolute gradient. */}
        <View>
          {speaking ? (
            <Feather name="square" size={24} color={iconColor} />
          ) : (
            <Icon name="volume" size={24} color={iconColor} />
          )}
        </View>
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
    borderColor: colors.glassBorder,
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
  },
  tileContent: {
    overflow: 'hidden',
    borderWidth: glass.borderWidth,
    borderColor: glass.borderColor,
  },
  label: {
    ...font(12, 'semiBold'),
  },
  pressed: {
    opacity: 0.7,
  },
});
