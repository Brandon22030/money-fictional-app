export const colors = {
  skyTop: '#EAF3FC',
  skyMid: '#B9D3EE',
  skyBottom: '#3E6A9E',
  navy900: '#0B1F40',
  navy800: '#0F2A55',
  navy700: '#1B3F7A',
  accent: '#7DB8F0',
  accentSoft: '#A9CFF5',
  slateBar: '#8FA3BF',
  textOnDark: '#FFFFFF',
  textOnDarkMuted: 'rgba(255,255,255,0.55)',
  textOnLight: '#0F2A55',
  textOnLightMuted: '#5B6F8C',
  glassFill: 'rgba(255,255,255,0.10)',
  glassBorder: 'rgba(255,255,255,0.22)',
  glassLight: 'rgba(255,255,255,0.65)',
  chipGold: '#E6D3A3',
  goldLight: '#F5E6BC',
  goldBase: '#D8B769',
  goldDeep: '#A67C2E',
  goldPearl: '#F7F3EA',
  goldPearlMuted: 'rgba(247,243,234,0.72)',
  goldEdge: 'rgba(216,183,105,0.45)',
  chipSilver: '#CBD5E1',
  positive: '#A9CFF5',
  warning: '#F2C6A0',
} as const;

export const radius = {
  sm: 12,
  md: 18,
  lg: 28,
  xl: 36,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

export const fontFamily = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semiBold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
} as const;

export const fontSize = {
  caption: 12,
  body: 15,
  title: 20,
  h2: 24,
  display: 40,
} as const;

export const numbers = {
  fontVariant: ['tabular-nums'] as ['tabular-nums'],
} as const;

export const shadow = {
  card: {
    shadowColor: colors.navy900,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 12,
  },
} as const;

export const blur = {
  glass: 30,
} as const;
