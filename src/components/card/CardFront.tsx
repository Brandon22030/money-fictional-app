import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatCardNumber } from '@/src/domain/card';
import { colors, font, numbers } from '@/src/theme';

import { cardText } from './cardPalette';
import { EmvChip } from './EmvChip';
import { GoldBrandName } from './GoldBrandName';
import { NetworkLogo } from './NetworkLogo';

export type CardFrontProps = {
  holderName: string;
  cardNumber: string;
  expiry: string;
  balanceLabel: string;
  brandMark?: ReactNode;
};

export function CardFront({ holderName, cardNumber, expiry, balanceLabel, brandMark }: CardFrontProps) {
  const { t } = useTranslation('card');
  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <View style={styles.brand}>
          {brandMark}
          <GoldBrandName />
        </View>
        <NetworkLogo testID="card-network-logo" />
      </View>
      <View style={styles.mid}>
        <EmvChip testID="card-chip" />
      </View>
      <Text testID="card-number" style={[styles.number, { fontVariant: numbers.fontVariant }]}>
        {formatCardNumber(cardNumber)}
      </Text>
      <View style={styles.bottom}>
        <View>
          <Text style={styles.label}>{t('holder')}</Text>
          <Text testID="card-holder" style={styles.value} numberOfLines={1}>
            {holderName}
          </Text>
        </View>
        <View>
          <Text style={styles.label}>{t('validThru')}</Text>
          <Text testID="card-expiry" style={[styles.value, { fontVariant: numbers.fontVariant }]}>
            {expiry}
          </Text>
        </View>
        <View style={styles.balance}>
          <Text style={styles.label}>{t('balance')}</Text>
          <Text testID="card-balance" style={[styles.value, { fontVariant: numbers.fontVariant }]}>
            {balanceLabel}
          </Text>
        </View>
      </View>
      <Text testID="card-fictional-front" style={styles.fictional}>
        {t('fictional')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'space-between' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mid: { flexDirection: 'row', alignItems: 'center' },
  number: {
    ...font(21, 'semiBold'),
    letterSpacing: 2.2,
    color: cardText.main,
  },
  bottom: { flexDirection: 'row', alignItems: 'flex-end', gap: 20 },
  balance: { marginLeft: 'auto', alignItems: 'flex-end' },
  label: { ...font(8, 'regular'), letterSpacing: 1.4, color: cardText.label, marginBottom: 4 },
  value: { ...font(13, 'semiBold'), letterSpacing: 0.8, color: cardText.main },
  // C2: 11 px / semiBold / pearl kept for legibility, position of the mockup (absolute, bottom 10).
  fictional: {
    ...font(11, 'semiBold'),
    position: 'absolute',
    left: -22,
    right: -22,
    bottom: -22,
    letterSpacing: 1.6,
    color: colors.goldPearl,
    textAlign: 'center',
  },
});
