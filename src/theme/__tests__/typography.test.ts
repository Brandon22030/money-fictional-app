import { font, typography } from '@/src/theme';

describe('typography', () => {
  it('computes a normal line height of 1.366 x size', () => {
    expect(font(12).lineHeight).toBe(16);
    expect(font(40).lineHeight).toBe(55);
    expect(font(52).lineHeight).toBe(71);
    expect(font(17).lineHeight).toBe(23);
  });

  it('picks the font family from the weight', () => {
    expect(font(13, 'bold').fontFamily).toBe('Manrope_700Bold');
    expect(font(13).fontFamily).toBe('Manrope_400Regular');
  });

  it('aligns the variants on the normal line height', () => {
    expect(typography.caption.lineHeight).toBe(16);
    expect(typography.body.lineHeight).toBe(20);
    expect(typography.bodyStrong.lineHeight).toBe(20);
    expect(typography.title.lineHeight).toBe(27);
    expect(typography.h2.lineHeight).toBe(33);
    expect(typography.display.lineHeight).toBe(55);
  });
});
