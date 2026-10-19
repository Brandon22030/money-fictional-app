import { useId } from 'react';
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import { NETWORK_NAME } from '@/src/config/brand';
import { gold } from '@/src/theme';

export type NetworkLogoProps = { height?: number; testID?: string };

export function NetworkLogo({ height = 26, testID }: NetworkLogoProps) {
  const id = `network-${useId().replace(/\W/g, '')}`;
  const [from, mid, to] = gold.gG.colors;
  const fill = `url(#${id})`;
  return (
    <Svg
      testID={testID}
      width={(height * 112) / 44}
      height={height}
      viewBox="0 0 112 44"
      accessibilityLabel={NETWORK_NAME}
    >
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={from} />
          <Stop offset="0.5" stopColor={mid} />
          <Stop offset="1" stopColor={to} />
        </LinearGradient>
      </Defs>
      <G fill="none" strokeLinecap="round" stroke={fill} strokeWidth="3">
        <Path d="M6 36a22 22 0 0 1 44 0" />
        <Path d="M14 36a14 14 0 0 1 28 0" />
      </G>
      <Circle cx="28" cy="36" r="4" fill={fill} />
      <SvgText x="56" y="30" fontSize="11" fontWeight="700" letterSpacing="1.2" fill={fill}>
        {NETWORK_NAME}
      </SvgText>
    </Svg>
  );
}
