import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/src/theme';

type Shape =
  | { tag: 'path'; d: string }
  | { tag: 'circle'; cx: number; cy: number; r: number }
  | {
      tag: 'rect';
      x: number;
      y: number;
      width: number;
      height: number;
      rx: number;
    };

// Paths copied unchanged from the <symbol id="i-*"> definitions of docs/mockup/index.html.
const shapes = {
  bell: [
    { tag: 'path', d: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' },
    { tag: 'path', d: 'M13.73 21a2 2 0 0 1-3.46 0' },
  ],
  menu: [{ tag: 'path', d: 'M4 7h16M4 12h12M4 17h16' }],
  down: [{ tag: 'path', d: 'M12 3v12M7 10l5 5 5-5M5 21h14' }],
  up: [{ tag: 'path', d: 'M12 15V3M7 8l5-5 5 5M5 21h14' }],
  send: [{ tag: 'path', d: 'M22 2 11 13M22 2l-7 20-4-9-9-4 22-7z' }],
  volume: [
    { tag: 'path', d: 'M11 5 6 9H2v6h4l5 4V5z' },
    { tag: 'path', d: 'M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14' },
  ],
  home: [{ tag: 'path', d: 'M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6' }],
  card: [
    { tag: 'rect', x: 2, y: 5, width: 20, height: 14, rx: 3 },
    { tag: 'path', d: 'M2 10h20M6 15h4' },
  ],
  pie: [
    { tag: 'path', d: 'M21 12A9 9 0 1 1 12 3' },
    { tag: 'path', d: 'M12 3v9h9' },
  ],
  clock: [
    { tag: 'circle', cx: 12, cy: 12, r: 9 },
    { tag: 'path', d: 'M12 7v5l3 2' },
  ],
  sliders: [
    { tag: 'path', d: 'M4 6h8M18 6h2M4 12h2M12 12h8M4 18h10M20 18h0' },
    { tag: 'circle', cx: 15, cy: 6, r: 2 },
    { tag: 'circle', cx: 9, cy: 12, r: 2 },
    { tag: 'circle', cx: 17, cy: 18, r: 2 },
  ],
  search: [
    { tag: 'circle', cx: 11, cy: 11, r: 7 },
    { tag: 'path', d: 'M21 21l-4.3-4.3' },
  ],
  edit: [{ tag: 'path', d: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z' }],
  refresh: [
    { tag: 'path', d: 'M23 4v6h-6M1 20v-6h6' },
    {
      tag: 'path',
      d: 'M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15',
    },
  ],
  flip: [
    {
      tag: 'path',
      d: 'M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3',
    },
  ],
  back: [
    { tag: 'path', d: 'M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z' },
    { tag: 'path', d: 'M18 9l-6 6M12 9l6 6' },
  ],
  check: [{ tag: 'path', d: 'M20 6 9 17l-5-5' }],
  star: [
    {
      tag: 'path',
      d: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1z',
    },
  ],
  heart: [
    {
      tag: 'path',
      d: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z',
    },
  ],
  sun: [
    { tag: 'circle', cx: 12, cy: 12, r: 4 },
    {
      tag: 'path',
      d: 'M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
    },
  ],
  users: [
    { tag: 'circle', cx: 9, cy: 8, r: 4 },
    {
      tag: 'path',
      d: 'M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2M17 4a4 4 0 0 1 0 7.7M22 21v-2a4 4 0 0 0-3-3.9',
    },
  ],
  info: [
    { tag: 'circle', cx: 12, cy: 12, r: 9 },
    { tag: 'path', d: 'M12 11v5M12 8h0' },
  ],
  trash: [{ tag: 'path', d: 'M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14' }],
} as const satisfies Record<string, readonly Shape[]>;

export type IconName = keyof typeof shapes;

export const ICON_NAMES = Object.keys(shapes) as IconName[];

export type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  testID?: string;
};

export function Icon({
  name,
  size = 24,
  color = colors.navy800,
  strokeWidth = 1.6,
  testID,
}: IconProps) {
  return (
    <Svg
      testID={testID}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      {(shapes[name] as readonly Shape[]).map((shape, index) => {
        switch (shape.tag) {
          case 'path':
            return <Path key={index} d={shape.d} />;
          case 'circle':
            return <Circle key={index} cx={shape.cx} cy={shape.cy} r={shape.r} />;
          case 'rect':
            return (
              <Rect
                key={index}
                x={shape.x}
                y={shape.y}
                width={shape.width}
                height={shape.height}
                rx={shape.rx}
              />
            );
        }
      })}
    </Svg>
  );
}
