import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon } from '@/src/components/ui';
import { FAVORITES } from '@/src/data/favorites';
import { colors, font, gradients, shadow } from '@/src/theme';

const AVATAR_SIZE = 58;

export function FavoritesRow() {
  const { t } = useTranslation('home');
  const router = useRouter();

  return (
    <View style={styles.section}>
      <AppText variant="bodyStrong" style={styles.title}>
        {t('favorites')}
      </AppText>
      <View style={styles.row}>
        {FAVORITES.map((favorite) => {
          const name = t(favorite.nameKey);
          return (
            <Pressable
              key={favorite.id}
              testID={`home-favorite-${favorite.id}`}
              accessibilityRole="button"
              accessibilityLabel={`${t('send')} - ${name}`}
              onPress={() => router.push({ pathname: '/keypad', params: { mode: 'send', contact: favorite.id } })}
              style={({ pressed }) => [styles.item, pressed ? styles.pressed : null]}
            >
              <View style={styles.shadow}>
                <LinearGradient
                  colors={gradients.navyCard.colors}
                  start={gradients.navyCard.start}
                  end={gradients.navyCard.end}
                  style={styles.avatar}
                >
                  <Icon name={favorite.icon} size={24} color={colors.accentSoft} />
                </LinearGradient>
              </View>
              <AppText variant="caption" numberOfLines={1} style={styles.name}>
                {name}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 14,
  },
  title: {
    ...font(16, 'bold'),
    color: colors.navy800,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    alignItems: 'center',
    gap: 6,
  },
  shadow: {
    borderRadius: AVATAR_SIZE / 2,
    ...shadow.card,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  name: {
    ...font(12, 'semiBold'),
    color: colors.navy800,
  },
  pressed: {
    opacity: 0.7,
  },
});
