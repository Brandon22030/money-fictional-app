import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { BankCard } from '@/src/components/card';
import { useTabBarClearance } from '@/src/components/navigation/tabBarLayout';
import { AppText, Screen } from '@/src/components/ui';
import { VoiceButton } from '@/src/components/voice/VoiceButton';
import { useBalanceParts } from '@/src/store/selectors';
import { useAppStore } from '@/src/store/useAppStore';
import { font, layout } from '@/src/theme';

import { ActionTile } from './ActionTile';
import { GoldLogo } from './GoldLogo';

export function CardScreen() {
  const { t } = useTranslation('cardScreen');
  const router = useRouter();
  const [flipped, setFlipped] = useState(false);
  const bottomClearance = useTabBarClearance();

  const holderName = useAppStore((state) => state.holderName);
  const card = useAppStore((state) => state.card);
  const balanceMinor = useAppStore((state) => state.balanceMinor);
  const currency = useAppStore((state) => state.currency);
  const language = useAppStore((state) => state.language);
  const regenerateCard = useAppStore((state) => state.regenerateCard);
  const balance = useBalanceParts();

  const toggleFlip = () => setFlipped((value) => !value);
  const goTo = (mode: string) => () => router.push({ pathname: '/keypad', params: { mode } });

  const confirmNewNumber = () => {
    Alert.alert(t('newNumber.title'), t('newNumber.message'), [
      { text: t('newNumber.cancel'), style: 'cancel' },
      { text: t('newNumber.confirm'), onPress: regenerateCard },
    ]);
  };

  return (
    <Screen testID="screen-card">
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomClearance }]}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="h2" style={styles.title}>
          {t('title')}
        </AppText>
        <View style={styles.cardWrap}>
          <BankCard
            testID="card-screen-card"
            holderName={holderName}
            cardNumber={card.number}
            expiry={card.expiry}
            cvv={card.cvv}
            balanceLabel={balance.full}
            flipped={flipped}
            onPress={toggleFlip}
            brandMark={<GoldLogo size={26} />}
          />
        </View>
        <AppText testID="card-hint" tone="onLight" style={styles.hint}>
          {t(flipped ? 'hint.back' : 'hint.front')}
        </AppText>
        <View style={styles.grid}>
          <View style={styles.row}>
            <ActionTile
              testID="action-flip"
              icon="flip"
              label={t('actions.flip')}
              onPress={toggleFlip}
            />
            <ActionTile
              testID="action-set"
              icon="edit"
              label={t('actions.set')}
              onPress={goTo('set')}
            />
          </View>
          <View style={styles.row}>
            <ActionTile
              testID="action-pay"
              icon="card"
              label={t('actions.pay')}
              onPress={goTo('pay')}
            />
            <ActionTile
              testID="action-withdraw"
              icon="up"
              label={t('actions.withdraw')}
              onPress={goTo('withdraw')}
            />
          </View>
          <View style={styles.row}>
            <View style={styles.cell}>
              <VoiceButton
                testID="action-listen"
                variant="tile"
                amountMinor={balanceMinor}
                currency={currency}
                language={language}
              />
            </View>
            <ActionTile
              testID="action-new-number"
              icon="refresh"
              label={t('actions.newNumber')}
              onPress={confirmNewNumber}
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenX,
    gap: layout.gap,
  },
  title: { paddingTop: 7, paddingHorizontal: 4 },
  cardWrap: { paddingTop: 8, alignItems: 'center' },
  hint: { ...font(12, 'semiBold'), textAlign: 'center', opacity: 0.75 },
  grid: { gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  cell: { flex: 1, justifyContent: 'center' },
});
