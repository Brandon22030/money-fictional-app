import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

import { NETWORK_NAME } from '@/src/config/brand';

import { gold } from './goldTokens';

export type NetworkLogoProps = { height?: number; testID?: string };

export function NetworkLogo({ height = 26, testID }: NetworkLogoProps) {
  return (
    <Svg
      testID={testID}
      width={(height * 112) / 44}
      height={height}
      viewBox="0 0 112 44"
      accessibilityLabel={NETWORK_NAME}
    >
      <G fill="none" strokeLinecap="round">
        <Path d="M6 36a22 22 0 0 1 44 0" stroke={gold.base} strokeWidth="3" />
        <Path d="M14 36a14 14 0 0 1 28 0" stroke={gold.light} strokeWidth="3" />
      </G>
      <Circle cx="28" cy="36" r="4" fill={gold.base} />
      <SvgText x="56" y="30" fontSize="11" fontWeight="700" letterSpacing="1.2" fill={gold.light}>
        {NETWORK_NAME}
      </SvgText>
    </Svg>
  );
}
