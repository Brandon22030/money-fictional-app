import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

import { NETWORK_NAME } from '@/src/config/brand';
import { colors } from '@/src/theme';

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
        <Path d="M6 36a22 22 0 0 1 44 0" stroke={colors.goldBase} strokeWidth="3" />
        <Path d="M14 36a14 14 0 0 1 28 0" stroke={colors.goldLight} strokeWidth="3" />
      </G>
      <Circle cx="28" cy="36" r="4" fill={colors.goldBase} />
      <SvgText x="56" y="30" fontSize="11" fontWeight="700" letterSpacing="1.2" fill={colors.goldLight}>
        {NETWORK_NAME}
      </SvgText>
    </Svg>
  );
}
