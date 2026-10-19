export type ArcSegment = {
  index: number;
  fraction: number;
  startAngle: number;
  endAngle: number;
  midAngle: number;
};

export type LabelPlacement = {
  path: 'top' | 'bottom';
  offsetPercent: number;
};

const FULL_TURN = 360;
const MAX_SWEEP = 359.99;

/** Angle 0 is 12 o'clock, growing clockwise. */
export function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

/**
 * Converts values to consecutive angular segments; invalid or non positive values are skipped from the total.
 * `gapFraction` (share of the full turn) is removed between segments, half on each side; midAngle is unchanged.
 */
export function computeSegments(values: number[], gapFraction = 0): ArcSegment[] {
  const safe = values.map((v) => (Number.isFinite(v) && v > 0 ? v : 0));
  const total = safe.reduce((sum, v) => sum + v, 0);
  if (total <= 0) return [];

  let cursor = 0;
  return safe.map((value, index) => {
    const fraction = value / total;
    const rawStart = cursor * FULL_TURN;
    cursor += fraction;
    const rawEnd = cursor * FULL_TURN;
    const inset = fraction > 0 ? Math.min((gapFraction * FULL_TURN) / 2, (rawEnd - rawStart) / 2) : 0;
    return {
      index,
      fraction,
      startAngle: rawStart + inset,
      endAngle: rawEnd - inset,
      midAngle: (rawStart + rawEnd) / 2,
    };
  });
}

/** SVG path of a circular arc between two angles (clockwise). */
export function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const sweep = Math.min(Math.max(endAngle - startAngle, 0), MAX_SWEEP);
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, startAngle + sweep);
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${round(start.x)} ${round(start.y)} A ${r} ${r} 0 ${largeArc} 1 ${round(end.x)} ${round(end.y)}`;
}

/**
 * Picks the guide path that keeps a label upright and its start offset (percent of the path length).
 * Top path: full circle clockwise from 12 o'clock. Bottom path: half circle from 9 to 3 o'clock through 6.
 */
export function labelPlacement(midAngle: number): LabelPlacement {
  const angle = ((midAngle % FULL_TURN) + FULL_TURN) % FULL_TURN;
  if (angle > 90 && angle < 270) {
    return {
      path: 'bottom',
      offsetPercent: round(((270 - angle) / 180) * 100),
    };
  }
  return { path: 'top', offsetPercent: round((angle / FULL_TURN) * 100) };
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
