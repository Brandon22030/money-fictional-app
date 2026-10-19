import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { fontFamily, numbers } from '@/src/theme';

import { gold } from './goldTokens';
import { NetworkLogo } from './NetworkLogo';
import { formatCardNumber } from './formatCardNumber';

export type CardBackProps = { holderName: string; cardNumber: string; cvv: string };

export function CardBack({ holderName, cardNumber, cvv }: CardBackProps) {
  const { t } = useTranslation('card');
  return (
    <View style={styles.root}>
      <View testID="card-stripe" style={styles.stripe} />
      <View style={styles.sigRow}>
        <View testID="card-signature" style={styles.signature}>
          <Text style={styles.signatureText} numberOfLines={1}>
            {holderName}
          </Text>
        </View>
        <View style={styles.cvvBox}>
          <Text style={styles.cvvLabel}>{t('cvv')}</Text>
          <Text testID="card-cvv" style={[styles.cvv, { fontVariant: numbers.fontVariant }]}>
            {cvv}
          </Text>
        </View>
      </View>
      <View style={styles.padded}>
        <Text style={styles.legal}>{t('legal')}</Text>
        <Text testID="card-fictional-back" style={styles.fictional}>
          {t('fictional')}
        </Text>
        <View style={styles.foot}>
          <Text style={[styles.footNumber, { fontVariant: numbers.fontVariant }]}>
            {formatCardNumber(cardNumber)}
          </Text>
          <NetworkLogo height={22} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'space-between' },
  stripe: { height: 38, marginTop: 22, backgroundColor: '#050B18' },
  sigRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 22 },
  signature: {
    flex: 1,
    height: 34,
    borderRadius: 6,
    backgroundColor: gold.pearl,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  signatureText: { fontFamily: fontFamily.medium, fontStyle: 'italic', fontSize: 14, color: '#2A3550' },
  cvvBox: {
    minWidth: 58,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: gold.pearl,
    alignItems: 'center',
  },
  cvvLabel: { fontFamily: fontFamily.medium, fontSize: 8, letterSpacing: 1, color: '#5B6F8C' },
  cvv: { fontFamily: fontFamily.bold, fontSize: 15, color: '#0F2A55' },
  padded: { paddingHorizontal: 22, paddingBottom: 18, gap: 6 },
  legal: { fontFamily: fontFamily.regular, fontSize: 9, lineHeight: 12, color: gold.pearlMuted },
  fictional: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    letterSpacing: 1.8,
    color: gold.pearlMuted,
    textAlign: 'center',
  },
  foot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footNumber: { fontFamily: fontFamily.medium, fontSize: 11, letterSpacing: 1, color: gold.pearlMuted },
});
