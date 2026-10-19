import { blur, colors, fontSize, gradients, radius, shadow, spacing } from '@/src/theme';

describe('design tokens', () => {
  it('matches the colors table', () => {
    expect(colors).toEqual({
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
    });
  });

  it('matches radius, spacing and font sizes', () => {
    expect(radius).toEqual({ sm: 12, md: 18, lg: 28, xl: 36, pill: 999 });
    expect(Object.values(spacing)).toEqual([4, 8, 12, 16, 20, 24, 32, 40]);
    expect(fontSize).toEqual({ caption: 12, body: 15, title: 20, h2: 24, display: 40 });
  });

  it('matches gradients, shadow and blur', () => {
    expect(gradients.sky.colors).toEqual([colors.skyTop, colors.skyMid, colors.skyBottom]);
    expect(gradients.navyCard.colors).toEqual([colors.navy800, colors.navy700]);
    expect(shadow.card).toMatchObject({
      shadowOffset: { width: 0, height: 12 },
      shadowRadius: 32,
      shadowOpacity: 0.25,
      shadowColor: '#0B1F40',
    });
    expect(blur.glass).toBe(30);
  });
});
