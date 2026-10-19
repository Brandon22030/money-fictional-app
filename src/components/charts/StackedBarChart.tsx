import { StyleSheet, View } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/src/components/ui/AppText';
import { colors, font, fontFamily } from '@/src/theme';

export type StackedBarDatum = { label: string; a: number; b: number };

export type StackedBarChartProps = {
  data: StackedBarDatum[];
  colors?: { a: string; b: string };
  legend: { a: string; b: string };
  /** Heading shown on the left of the legend row. */
  title?: string;
};

const WIDTH = 348;
const HEIGHT = 180;
const PLOT_LEFT = 14;
const PLOT_RIGHT = 334;
const PLOT_TOP = 21;
const BASELINE = 150;
const BAR_X0 = 28;
const BAR_STEP = 52;
const BAR_WIDTH = 26;
const BAR_RADIUS = 6;
const SEGMENT_GAP = 3;
const GRID_Y = [30, 70, 110, 150];

function clean(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function StackedBarChart({ data, colors: barColors, legend, title }: StackedBarChartProps) {
  const { t } = useTranslation('charts');
  const colorA = barColors?.a ?? colors.accent;
  const colorB = barColors?.b ?? colors.slateBar;
  const max = Math.max(0, ...data.map((d) => clean(d.a) + clean(d.b)));
  const unit = max > 0 ? (BASELINE - PLOT_TOP - SEGMENT_GAP) / max : 0;

  return (
    <View testID="stacked-bar-chart">
      <View style={styles.headRow}>
        {title ? (
          <AppText tone="onDark" style={styles.title}>
            {title}
          </AppText>
        ) : (
          <View />
        )}
        <View style={styles.legend}>
          <View style={[styles.dot, { backgroundColor: colorA }]} />
          <AppText style={styles.legendText}>
            {legend.a}
          </AppText>
          <View style={[styles.dot, styles.dotNext, { backgroundColor: colorB }]} />
          <AppText style={styles.legendText}>
            {legend.b}
          </AppText>
        </View>
      </View>
      <Svg
        width="100%"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={styles.svg}
        accessibilityLabel={t('bars.a11y')}
      >
        {GRID_Y.map((y) => (
          <Line
            key={y}
            x1={PLOT_LEFT}
            x2={PLOT_RIGHT}
            y1={y}
            y2={y}
            stroke="rgba(255,255,255,0.28)"
            strokeDasharray="3 6"
          />
        ))}
        {data.map((datum, i) => {
          const heightB = clean(datum.b) * unit;
          const heightA = clean(datum.a) * unit;
          const x = BAR_X0 + BAR_STEP * i;
          const cx = x + BAR_WIDTH / 2;
          const yB = BASELINE - heightB;
          const gap = heightB > 0 && heightA > 0 ? SEGMENT_GAP : 0;
          const yA = yB - gap - heightA;
          return (
            <G key={`${datum.label}-${i}`} testID={`bar-${i}`}>
              {heightB > 0 ? (
                <Rect
                  x={x}
                  y={yB}
                  width={BAR_WIDTH}
                  height={heightB}
                  rx={BAR_RADIUS}
                  fill={colorB}
                />
              ) : null}
              {heightA > 0 ? (
                <Rect
                  x={x}
                  y={yA}
                  width={BAR_WIDTH}
                  height={heightA}
                  rx={BAR_RADIUS}
                  fill={colorA}
                />
              ) : null}
              <SvgText
                x={cx}
                testID={`bar-label-${i}`}
                y={170}
                textAnchor="middle"
                fontSize={10}
                fontFamily={fontFamily.regular}
                fill="rgba(255,255,255,0.6)"
              >
                {datum.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: font(14, 'bold'),
  legend: { flexDirection: 'row', alignItems: 'center' },
  legendText: { ...font(11, 'semiBold'), color: 'rgba(255,255,255,0.75)' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  dotNext: { marginLeft: 12 },
  svg: { aspectRatio: WIDTH / HEIGHT },
});
