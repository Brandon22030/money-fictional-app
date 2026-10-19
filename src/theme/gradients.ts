import { colors } from './tokens';

export const gradients = {
  sky: {
    colors: [colors.skyTop, colors.skyMid, colors.skyBottom] as const,
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  navyCard: {
    colors: [colors.navy800, colors.navy700] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
} as const;
