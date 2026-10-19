import { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Polygon, Rect } from 'react-native-svg';

// 135deg stripes of 6 px each (#EAF3FC / #D3E3F4): the horizontal period is 12 * sqrt(2).
const PERIOD = 12 * Math.SQRT2;
const LIGHT = '#EAF3FC';
const DARK = '#D3E3F4';

/** Striped signature panel background (mockup `.sig`). */
export function SignatureStripes() {
  const id = `stripes-${useId().replace(/\W/g, '')}`;
  const p = PERIOD;
  const half = p / 2;
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id={id} width={p} height={p} patternUnits="userSpaceOnUse">
          <Rect width={p} height={p} fill={LIGHT} />
          <Polygon points={`${half},0 ${p},0 0,${p} 0,${half}`} fill={DARK} />
          <Polygon points={`${p},${half} ${p},${p} ${half},${p}`} fill={DARK} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
