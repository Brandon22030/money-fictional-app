import { useId } from 'react';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

import { BANK_NAME } from '@/src/config/brand';
import { fontFamily, gold } from '@/src/theme';

const WIDTH = 64;
const HEIGHT = 23;

/** Bank name with the gold gradient of the mockup (17px bold, letter-spacing .5). */
export function GoldBrandName() {
  const id = `gold-brand-${useId().replace(/\W/g, '')}`;
  const [from, mid, to] = gold.text.colors;
  return (
    <Svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} accessibilityLabel={BANK_NAME}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={from} />
          <Stop offset="0.5" stopColor={mid} />
          <Stop offset="1" stopColor={to} />
        </LinearGradient>
      </Defs>
      <SvgText x="0" y="18" fontFamily={fontFamily.bold} fontSize="17" letterSpacing="0.5" fill={`url(#${id})`}>
        {BANK_NAME}
      </SvgText>
    </Svg>
  );
}
