import { useId } from 'react';
import Svg, { Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { gold } from './goldTokens';

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
          <Stop offset="0" stopColor={gold.light} />
          <Stop offset="0.45" stopColor={gold.base} />
          <Stop offset="1" stopColor={gold.deep} />
        </LinearGradient>
      </Defs>
      <Rect width="52" height="40" rx="8" fill={`url(#${id})`} />
      <G fill="none" stroke={gold.deep} strokeWidth="1.1" opacity="0.85">
        <Path d="M0 14h14M0 26h14M38 14h14M38 26h14M14 0v40M38 0v40M14 20h24" />
        <Rect x="14" y="10" width="24" height="20" rx="5" />
      </G>
      <Rect x="0.5" y="0.5" width="51" height="39" rx="7.5" fill="none" stroke={gold.light} opacity="0.6" />
    </Svg>
  );
}
