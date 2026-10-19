import { useState } from 'react';
import { Platform, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, Path, Text as SvgText, TextPath } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { Icon, type IconName } from '@/src/components/ui/Icon';
import { colors, fontFamily } from '@/src/theme';

import { computeSegments, describeArc, labelPlacement, polarToCartesian } from './arcMath';

export type RingSegment = {
  key: string;
  label: string;
  value: number;
  color: string;
  icon: IconName;
};

export type RingGaugeProps = {
  segments: RingSegment[];
  centerLabel: string;
  centerCaption?: string;
  /** Largest width of the ring; it otherwise fills the available width. */
  maxSize?: number;
  /** Curved labels via textPath; defaults to straight labels on Android where textPath is unreliable. */
  curvedLabels?: boolean;
};

const VIEW_BOX = 340;
const CENTER = VIEW_BOX / 2;
const RING_RADIUS = 100;
const RING_WIDTH = 46;
const SEGMENT_GAP = 0.012;
const TOP_LABEL_RADIUS = 95;
const BOTTOM_LABEL_RADIUS = 105;
const BADGE_RADIUS = 146;
const BADGE_SIZE = 35;
const BADGE_ICON_SIZE = 18;
/** Fixed badge angles (degrees from 12 o'clock) per segment index: receive, send, pay, withdraw. */
export const BADGE_ANGLES = [-62, -22, 18, 58] as const;
/** Usable width of the hole of the ring (inner diameter 2 * (100 - 23) = 154, minus a margin). */
const CENTER_MAX_WIDTH = 130;
const CENTER_FONT_SIZE = 44;
/**
 * Smallest centre font size: below it the figure stops being legible. Compact labels
 * (formatCompact) never reach it; a longer one (more than 13 characters) keeps this size and may
 * overflow the hole rather than become unreadable.
 */
export const CENTER_MIN_FONT_SIZE = 16;
/** Average glyph width of the bold digits, as a fraction of the font size (slightly generous). */
const CENTER_GLYPH_RATIO = 0.6;
const TOP_PATH_ID = 'ring-top-path';
const BOTTOM_PATH_ID = 'ring-bottom-path';

const TOP_PATH = `M${CENTER} ${CENTER - TOP_LABEL_RADIUS} A${TOP_LABEL_RADIUS} ${TOP_LABEL_RADIUS} 0 1 1 ${CENTER} ${CENTER + TOP_LABEL_RADIUS} A${TOP_LABEL_RADIUS} ${TOP_LABEL_RADIUS} 0 1 1 ${CENTER} ${CENTER - TOP_LABEL_RADIUS}`;
const BOTTOM_PATH = `M${CENTER - BOTTOM_LABEL_RADIUS} ${CENTER} A${BOTTOM_LABEL_RADIUS} ${BOTTOM_LABEL_RADIUS} 0 0 0 ${CENTER + BOTTOM_LABEL_RADIUS} ${CENTER}`;

/**
 * Font size of the centre label: 44 for short labels, smaller so a long one stays inside the ring,
 * never below CENTER_MIN_FONT_SIZE.
 */
export function centerFontSize(label: string): number {
  const fitted = CENTER_MAX_WIDTH / (Math.max(label.length, 1) * CENTER_GLYPH_RATIO);
  return Math.max(CENTER_MIN_FONT_SIZE, Math.min(CENTER_FONT_SIZE, fitted));
}

export function RingGauge({
  segments,
  centerLabel,
  centerCaption,
  maxSize = 330,
  curvedLabels = Platform.OS !== 'android',
}: RingGaugeProps) {
  const { t } = useTranslation('charts');
  const [width, setWidth] = useState(maxSize);
  const size = Math.min(width, maxSize);
  const arcs = computeSegments(
    segments.map((s) => s.value),
    SEGMENT_GAP,
  ).filter((arc) => arc.fraction > 0);
  const scale = size / VIEW_BOX;
  const labelProps = {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    fill: colors.textOnDark,
    letterSpacing: 0.4,
  };

  const onLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    if (next > 0) setWidth(next);
  };

  return (
    <View style={styles.wrap} onLayout={onLayout}>
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
            stroke={arcs.length === 0 ? colors.slateBar : 'rgba(255,255,255,0.08)'}
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
            fontSize={centerFontSize(centerLabel)}
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
              fill="rgba(255,255,255,0.6)"
            >
              {centerCaption}
            </SvgText>
          ) : null}
        </Svg>
        {arcs.map((arc) => {
          const segment = segments[arc.index];
          const angle = BADGE_ANGLES[arc.index % BADGE_ANGLES.length];
          const point = polarToCartesian(CENTER, CENTER, BADGE_RADIUS, angle);
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
              <Icon name={segment.icon} size={BADGE_ICON_SIZE * scale} color={colors.accentSoft} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', alignItems: 'center' },
  badge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy800,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
});
