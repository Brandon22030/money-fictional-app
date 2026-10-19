import { computeSegments, describeArc, labelPlacement, polarToCartesian } from '../arcMath';

describe('arcMath', () => {
  it('places angle 0 at 12 o clock and 90 at 3 o clock', () => {
    const top = polarToCartesian(100, 100, 50, 0);
    expect(top.x).toBeCloseTo(100);
    expect(top.y).toBeCloseTo(50);
    const right = polarToCartesian(100, 100, 50, 90);
    expect(right.x).toBeCloseTo(150);
    expect(right.y).toBeCloseTo(100);
  });

  it('computes consecutive segments covering 360 degrees', () => {
    const segments = computeSegments([1, 1, 2]);
    expect(segments.map((s) => s.startAngle)).toEqual([0, 90, 180]);
    expect(segments[2].endAngle).toBeCloseTo(360);
    expect(segments[0].midAngle).toBe(45);
    expect(segments[2].fraction).toBe(0.5);
  });

  it('returns no segment for empty, zero or invalid data', () => {
    expect(computeSegments([])).toEqual([]);
    expect(computeSegments([0, 0])).toEqual([]);
    expect(computeSegments([NaN, -3])).toEqual([]);
  });

  it('describes an arc path with the right large-arc flag', () => {
    expect(describeArc(100, 100, 50, 0, 90)).toBe('M 100 50 A 50 50 0 0 1 150 100');
    expect(describeArc(100, 100, 50, 0, 270)).toContain('A 50 50 0 1 1');
  });

  it('keeps a full circle drawable', () => {
    expect(describeArc(100, 100, 50, 0, 360)).toMatch(/^M 100 50 A 50 50 0 1 1 /);
  });

  it('chooses upright guide paths and offsets for labels', () => {
    expect(labelPlacement(90)).toEqual({ path: 'top', offsetPercent: 25 });
    expect(labelPlacement(270)).toEqual({ path: 'top', offsetPercent: 75 });
    expect(labelPlacement(180)).toEqual({ path: 'bottom', offsetPercent: 50 });
    expect(labelPlacement(207)).toEqual({ path: 'bottom', offsetPercent: 35 });
  });
});
