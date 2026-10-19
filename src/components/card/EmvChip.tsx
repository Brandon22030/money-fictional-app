import { useId } from 'react';
import Svg, { Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { colors } from '@/src/theme';

export type EmvChipProps = { width?: number; testID?: string };

export function EmvChip({ width = 52, testID }: EmvChipProps) {
  const id = `chip-${useId().replace(/\W/g, '')}`;
  return (
    <Svg
      testID={testID}
      width={width}
      height={(width * 40) / 52}
      viewBox="0 0 52 40"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#F8EBC4" />
          <Stop offset="0.45" stopColor={colors.goldBase} />
          <Stop offset="1" stopColor={colors.goldDeep} />
        </LinearGradient>
      </Defs>
      <Rect width="52" height="40" rx="8" fill={`url(#${id})`} />
      <G fill="none" stroke="#7A5A1E" strokeWidth="1.2" opacity="0.8">
        <Path d="M0 14h14M0 26h14M38 14h14M38 26h14M14 0v40M38 0v40M14 20h24" />
        <Rect x="14" y="10" width="24" height="20" rx="5" />
      </G>
    </Svg>
  );
}
