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
          <Stop offset="0" stopColor={colors.goldLight} />
          <Stop offset="0.45" stopColor={colors.goldBase} />
          <Stop offset="1" stopColor={colors.goldDeep} />
        </LinearGradient>
      </Defs>
      <Rect width="52" height="40" rx="8" fill={`url(#${id})`} />
      <G fill="none" stroke={colors.goldDeep} strokeWidth="1.1" opacity="0.85">
        <Path d="M0 14h14M0 26h14M38 14h14M38 26h14M14 0v40M38 0v40M14 20h24" />
        <Rect x="14" y="10" width="24" height="20" rx="5" />
      </G>
      <Rect x="0.5" y="0.5" width="51" height="39" rx="7.5" fill="none" stroke={colors.goldLight} opacity="0.6" />
    </Svg>
  );
}
