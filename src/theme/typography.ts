import type { TextStyle } from 'react-native';
import { fontFamily, fontSize, numbers } from './tokens';

export type TextVariant = 'caption' | 'body' | 'bodyStrong' | 'title' | 'h2' | 'display';
export type FontWeight = keyof typeof fontFamily;

const NORMAL_LINE_HEIGHT = 1.366;

export function font(size: number, weight: FontWeight = 'regular'): TextStyle {
  return {
    fontFamily: fontFamily[weight],
    fontSize: size,
    lineHeight: Math.round(size * NORMAL_LINE_HEIGHT),
  };
}

export const typography: Record<TextVariant, TextStyle> = {
  caption: font(fontSize.caption, 'medium'),
  body: font(fontSize.body, 'regular'),
  bodyStrong: font(fontSize.body, 'semiBold'),
  title: font(fontSize.title, 'bold'),
  h2: font(fontSize.h2, 'bold'),
  display: {
    ...font(fontSize.display, 'bold'),
    fontVariant: numbers.fontVariant,
  },
};
