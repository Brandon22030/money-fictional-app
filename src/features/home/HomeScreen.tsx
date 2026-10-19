import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';

import { useTabBarClearance } from '@/src/components/navigation/tabBarLayout';
import { AppText, Screen, TicketCard } from '@/src/components/ui';
import { getAffirmationOfTheDay } from '@/src/data/affirmations';
import { colors, font, layout } from '@/src/theme';

import { BalanceCard } from './BalanceCard';
import { FavoritesRow } from './FavoritesRow';
import { HomeHeader } from './HomeHeader';
import { RecentIntentions } from './RecentIntentions';

export function HomeScreen() {
  const { t } = useTranslation('home');
  const affirmationKey = getAffirmationOfTheDay();
  const bottomClearance = useTabBarClearance();

  return (
    <Screen testID="screen-home">
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomClearance }]}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader />
        <BalanceCard />
        <TicketCard
          testID="home-affirmation"
          variant="affirmation"
          tab={t('affirmationTitle')}
        >
          <AppText variant="bodyStrong" style={styles.affirmation}>
            {t(affirmationKey)}
          </AppText>
        </TicketCard>
        <FavoritesRow />
        <RecentIntentions />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenX,
    gap: layout.gap,
  },
  affirmation: {
    ...font(17, 'semiBold'),
    lineHeight: Math.round(17 * 1.35),
    color: colors.navy800,
  },
});
