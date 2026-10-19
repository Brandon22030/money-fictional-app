import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, View } from 'react-native';

import { AppText, RoundIconButton } from '@/src/components/ui';
import { APP_NAME } from '@/src/config/brand';
import { useHasUnseenIntentions } from '@/src/store/selectors';

import { colors, font } from '@/src/theme';

const logoMark = require('@/assets/brand/logo-mark.png');

export function HomeHeader() {
  const { t } = useTranslation('home');
  const router = useRouter();
  const hasUnseenIntentions = useHasUnseenIntentions();

  return (
    <View style={styles.row}>
      <View style={styles.brand}>
        <Image source={logoMark} style={styles.logo} accessibilityIgnoresInvertColors />
        <AppText variant="title" style={styles.name}>
          {APP_NAME}
        </AppText>
      </View>
      <View style={styles.actions}>
        <RoundIconButton
          testID="home-history"
          icon="bell"
          badge={hasUnseenIntentions}
          accessibilityLabel={t('notifications')}
          onPress={() => router.push('/history')}
        />
        <RoundIconButton
          testID="home-settings"
          icon="menu"
          accessibilityLabel={t('menu')}
          onPress={() => router.push('/settings')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    ...font(20, 'bold'),
    color: colors.navy800,
  },
  logo: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
});
