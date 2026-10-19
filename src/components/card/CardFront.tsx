import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';

import { BANK_NAME } from '@/src/config/brand';
import { fontFamily, numbers } from '@/src/theme';

import { EmvChip } from './EmvChip';
import { gold } from './goldTokens';
import { NetworkLogo } from './NetworkLogo';
import { formatCardNumber } from './formatCardNumber';

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
          <Text style={styles.brandName}>{BANK_NAME}</Text>
        </View>
        <NetworkLogo testID="card-network-logo" />
      </View>
      <View style={styles.mid}>
        <EmvChip testID="card-chip" />
        <Svg
          width={26}
          height={26}
          viewBox="0 0 24 24"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Path
            d="M7 8a6 6 0 0 1 0 8M11 5.5a10 10 0 0 1 0 13M15 3a14 14 0 0 1 0 18"
            fill="none"
            stroke={gold.light}
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.85"
          />
        </Svg>
      </View>
      <Text testID="card-number" style={[styles.number, { fontVariant: numbers.fontVariant }]}>
        {formatCardNumber(cardNumber)}
      </Text>
      <View style={styles.bottom}>
        <View style={styles.holder}>
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
  brandName: { fontFamily: fontFamily.bold, fontSize: 16, color: gold.base, letterSpacing: 0.4 },
  mid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  number: {
    fontFamily: fontFamily.semiBold,
    fontSize: 20,
    letterSpacing: 2,
    color: gold.pearl,
  },
  bottom: { flexDirection: 'row', alignItems: 'flex-end', gap: 14 },
  holder: { flex: 1 },
  balance: { alignItems: 'flex-end' },
  label: { fontFamily: fontFamily.medium, fontSize: 9, letterSpacing: 1, color: gold.pearlMuted },
  value: { fontFamily: fontFamily.semiBold, fontSize: 13, color: gold.pearl },
  fictional: {
    fontFamily: fontFamily.bold,
    fontSize: 9,
    letterSpacing: 1.6,
    color: gold.pearlMuted,
    textAlign: 'center',
  },
});
