import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatCardNumber } from '@/src/domain/card';
import { colors, font, numbers } from '@/src/theme';

import { cardText } from './cardPalette';
import { NetworkLogo } from './NetworkLogo';
import { SignatureStripes } from './SignatureStripes';
import { toTitleCase } from './toTitleCase';

export type CardBackProps = { holderName: string; cardNumber: string; cvv: string };

export function CardBack({ holderName, cardNumber, cvv }: CardBackProps) {
  const { t, i18n } = useTranslation('card');
  return (
    <View style={styles.root}>
      <LinearGradient testID="card-stripe" colors={['#050E20', '#0B1F40']} style={styles.stripe} />
      <View style={styles.sigRow}>
        <View testID="card-signature" style={styles.signature}>
          <SignatureStripes />
          <Text style={styles.signatureText} numberOfLines={1}>
            {toTitleCase(holderName, i18n.language)}
          </Text>
        </View>
        <View style={styles.cvvBox}>
          <Text style={styles.cvvLabel}>{t('cvv')}</Text>
          <Text testID="card-cvv" style={[styles.cvv, { fontVariant: numbers.fontVariant }]}>
            {cvv}
          </Text>
        </View>
      </View>
      <Text style={styles.legal}>{t('legal')}</Text>
      {/* C2: 11 px / semiBold / pearl kept for legibility, margins and letter-spacing of the mockup. */}
      <Text testID="card-fictional-back" style={styles.fictional}>
        {t('fictional')}
      </Text>
      <View style={styles.foot}>
        <Text style={[styles.footNumber, { fontVariant: numbers.fontVariant }]}>
          {formatCardNumber(cardNumber)}
        </Text>
        <NetworkLogo height={24} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  stripe: { height: 36, marginTop: 18 },
  sigRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, marginHorizontal: 22 },
  signature: {
    flex: 1,
    height: 34,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  signatureText: { ...font(15, 'regular'), fontStyle: 'italic', color: colors.navy800 },
  cvvBox: {
    height: 34,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cvvLabel: { ...font(8, 'regular'), letterSpacing: 1.4, color: cardText.cvvLabel },
  cvv: { ...font(15, 'bold'), color: colors.navy800 },
  legal: {
    ...font(9, 'regular'),
    lineHeight: 13.5,
    marginTop: 9,
    marginHorizontal: 22,
    color: cardText.legal,
  },
  fictional: {
    ...font(11, 'semiBold'),
    marginTop: 14,
    marginHorizontal: 22,
    letterSpacing: 2.4,
    color: colors.goldPearl,
    textAlign: 'center',
  },
  foot: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footNumber: { ...font(10, 'regular'), letterSpacing: 1.5, color: cardText.foot },
});
