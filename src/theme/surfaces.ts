import { colors } from './tokens';

export const layout = {
  screenTop: 58,
  screenX: 20,
  gap: 14,
  tabBarBottom: 22,
} as const;

const diagonal = { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } } as const;

export const glass = {
  colors: ['rgba(15,42,85,0.94)', 'rgba(27,63,122,0.9)'] as const,
  ...diagonal,
  highlight: 'rgba(169,207,245,0.28)',
  borderColor: colors.glassBorder,
  borderWidth: 1,
} as const;

export const ticket = {
  default: { colors: ['#C9E2F9', '#A9CFF5'] as const, ...diagonal },
  affirmation: { colors: ['#D8EAFB', '#B9D3EE'] as const, ...diagonal },
  borderColor: 'rgba(255,255,255,0.6)',
  borderWidth: 1,
  radius: 18,
} as const;

export const bankCard = {
  linear: {
    colors: ['#1B3F7A', '#0F2A55', '#0B1F40'] as const,
    locations: [0, 0.55, 1] as const,
    ...diagonal,
  },
  radial: 'rgba(125,184,240,0.28)',
  borderColor: 'rgba(216,183,105,0.4)',
  borderWidth: 1,
  radius: 24,
} as const;

export const gold = {
  text: { colors: ['#F5E6BC', '#D8B769', '#A67C2E'] as const, ...diagonal },
  gG: { colors: ['#F5E6BC', '#D8B769', '#B8903F'] as const, ...diagonal },
} as const;

function dropShadow(color: string, opacity: number, y: number, blur: number, elevation: number) {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: y },
    shadowOpacity: opacity,
    shadowRadius: blur,
    elevation,
  } as const;
}

export const shadows = {
  ticket: dropShadow(colors.navy900, 0.18, 8, 20, 6),
  tile: dropShadow(colors.navy900, 0.25, 8, 20, 6),
  tabBar: dropShadow(colors.navy900, 0.45, 14, 32, 14),
  activeTab: dropShadow(colors.accent, 0.35, 6, 16, 6),
  bankCard: dropShadow(colors.navy900, 0.5, 24, 44, 16),
} as const;
