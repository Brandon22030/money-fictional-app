import { Feather } from '@expo/vector-icons';
import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Path, Text as SvgText, TextPath } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { colors, fontFamily } from '@/src/theme';

import { computeSegments, describeArc, labelPlacement, polarToCartesian } from './arcMath';

export type FeatherIconName = keyof typeof Feather.glyphMap;

export type RingSegment = {
  key: string;
  label: string;
  value: number;
  color: string;
  icon: FeatherIconName;
};

export type RingGaugeProps = {
  segments: RingSegment[];
  centerLabel: string;
  centerCaption?: string;
  size?: number;
  /** Curved labels via textPath; defaults to straight labels on Android where textPath is unreliable. */
  curvedLabels?: boolean;
};

const VIEW_BOX = 340;
const CENTER = VIEW_BOX / 2;
const RING_RADIUS = 100;
const RING_WIDTH = 46;
const TOP_LABEL_RADIUS = 95;
const BOTTOM_LABEL_RADIUS = 105;
const BADGE_RADIUS = 146;
const BADGE_SIZE = 34;
const TOP_PATH_ID = 'ring-top-path';
const BOTTOM_PATH_ID = 'ring-bottom-path';

const TOP_PATH = `M${CENTER} ${CENTER - TOP_LABEL_RADIUS} A${TOP_LABEL_RADIUS} ${TOP_LABEL_RADIUS} 0 1 1 ${CENTER} ${CENTER + TOP_LABEL_RADIUS} A${TOP_LABEL_RADIUS} ${TOP_LABEL_RADIUS} 0 1 1 ${CENTER} ${CENTER - TOP_LABEL_RADIUS}`;
const BOTTOM_PATH = `M${CENTER - BOTTOM_LABEL_RADIUS} ${CENTER} A${BOTTOM_LABEL_RADIUS} ${BOTTOM_LABEL_RADIUS} 0 0 0 ${CENTER + BOTTOM_LABEL_RADIUS} ${CENTER}`;

export function RingGauge({
  segments,
  centerLabel,
  centerCaption,
  size = 330,
  curvedLabels = Platform.OS !== 'android',
}: RingGaugeProps) {
  const { t } = useTranslation('charts');
  const arcs = computeSegments(segments.map((s) => s.value)).filter((arc) => arc.fraction > 0);
  const scale = size / VIEW_BOX;
  const labelProps = {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    fill: colors.textOnDark,
  };

  return (
    <View
      testID="ring-gauge"
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('ring.a11y')}
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${VIEW_BOX} ${VIEW_BOX}`}>
        <Defs>
          <Path id={TOP_PATH_ID} d={TOP_PATH} />
          <Path id={BOTTOM_PATH_ID} d={BOTTOM_PATH} />
        </Defs>
        <Circle
          testID="ring-track"
          cx={CENTER}
          cy={CENTER}
          r={RING_RADIUS}
          fill="none"
          stroke={arcs.length === 0 ? colors.slateBar : colors.glassFill}
          strokeOpacity={arcs.length === 0 ? 0.35 : 1}
          strokeWidth={RING_WIDTH}
        />
        {arcs.map((arc) => (
          <Path
            key={segments[arc.index].key}
            testID={`ring-segment-${segments[arc.index].key}`}
            d={describeArc(CENTER, CENTER, RING_RADIUS, arc.startAngle, arc.endAngle)}
            fill="none"
            stroke={segments[arc.index].color}
            strokeWidth={RING_WIDTH}
          />
        ))}
        {arcs.map((arc) => {
          const segment = segments[arc.index];
          if (curvedLabels) {
            const placement = labelPlacement(arc.midAngle);
            return (
              <SvgText key={segment.key} testID={`ring-label-${segment.key}`} {...labelProps}>
                <TextPath
                  href={placement.path === 'top' ? `#${TOP_PATH_ID}` : `#${BOTTOM_PATH_ID}`}
                  startOffset={`${placement.offsetPercent}%`}
                  textAnchor="middle"
                >
                  {segment.label}
                </TextPath>
              </SvgText>
            );
          }
          const point = polarToCartesian(CENTER, CENTER, RING_RADIUS, arc.midAngle);
          return (
            <SvgText
              key={segment.key}
              testID={`ring-label-${segment.key}`}
              x={point.x}
              y={point.y + 4}
              textAnchor="middle"
              {...labelProps}
            >
              {segment.label}
            </SvgText>
          );
        })}
        <SvgText
          x={CENTER}
          y={CENTER + 4}
          testID="ring-center"
          textAnchor="middle"
          fontSize={44}
          fontFamily={fontFamily.bold}
          fill={colors.textOnDark}
        >
          {centerLabel}
        </SvgText>
        {centerCaption ? (
          <SvgText
            x={CENTER}
            y={CENTER + 26}
            testID="ring-caption"
            textAnchor="middle"
            fontSize={12}
            fontFamily={fontFamily.regular}
            fill={colors.textOnDarkMuted}
          >
            {centerCaption}
          </SvgText>
        ) : null}
      </Svg>
      {arcs.map((arc) => {
        const segment = segments[arc.index];
        const point = polarToCartesian(CENTER, CENTER, BADGE_RADIUS, arc.midAngle);
        const badge = BADGE_SIZE * scale;
        return (
          <View
            key={segment.key}
            testID={`ring-badge-${segment.key}`}
            style={[
              styles.badge,
              {
                width: badge,
                height: badge,
                borderRadius: badge / 2,
                left: point.x * scale - badge / 2,
                top: point.y * scale - badge / 2,
              },
            ]}
          >
            <Feather name={segment.icon} size={Math.round(badge * 0.5)} color={colors.accentSoft} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy800,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
});
