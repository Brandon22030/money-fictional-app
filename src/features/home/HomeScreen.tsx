import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';

import { AppText, Screen, TicketCard } from '@/src/components/ui';
import { getAffirmationOfTheDay } from '@/src/data/affirmations';
import { spacing } from '@/src/theme';

import { BalanceCard } from './BalanceCard';
import { FavoritesRow } from './FavoritesRow';
import { HomeHeader } from './HomeHeader';
import { RecentIntentions } from './RecentIntentions';

export function HomeScreen() {
  const { t } = useTranslation('home');
  const affirmationKey = getAffirmationOfTheDay();

  return (
    <Screen testID="screen-home">
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader />
        <BalanceCard />
        <TicketCard testID="home-affirmation">
          <AppText variant="caption" tone="onLightMuted">
            {t('affirmationTitle')}
          </AppText>
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
    padding: spacing.xl,
    paddingBottom: 140,
    gap: spacing.xl,
  },
  affirmation: {
    marginTop: spacing.sm,
  },
});
