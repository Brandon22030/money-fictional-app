import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui';
import { FAVORITES } from '@/src/data/favorites';
import { colors, radius, spacing } from '@/src/theme';

const AVATAR_SIZE = 56;

export function FavoritesRow() {
  const { t } = useTranslation('home');
  const router = useRouter();

  return (
    <View>
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
              <View style={styles.avatar}>
                <AppText variant="title" style={styles.initial}>
                  {name.charAt(0).toUpperCase()}
                </AppText>
              </View>
              <AppText variant="caption" numberOfLines={1}>
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
  title: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    alignItems: 'center',
    gap: spacing.xs,
    width: AVATAR_SIZE + spacing.md,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  initial: {
    color: colors.navy800,
  },
  pressed: {
    opacity: 0.7,
  },
});
