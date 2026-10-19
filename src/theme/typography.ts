import type { TextStyle } from 'react-native';
import { fontFamily, fontSize, numbers } from './tokens';

export type TextVariant = 'caption' | 'body' | 'bodyStrong' | 'title' | 'h2' | 'display';

export const typography: Record<TextVariant, TextStyle> = {
  caption: { fontFamily: fontFamily.medium, fontSize: fontSize.caption, lineHeight: 16 },
  body: { fontFamily: fontFamily.regular, fontSize: fontSize.body, lineHeight: 22 },
  bodyStrong: { fontFamily: fontFamily.semiBold, fontSize: fontSize.body, lineHeight: 22 },
  title: { fontFamily: fontFamily.bold, fontSize: fontSize.title, lineHeight: 26 },
  h2: { fontFamily: fontFamily.bold, fontSize: fontSize.h2, lineHeight: 30 },
  display: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.display,
    lineHeight: 48,
    fontVariant: numbers.fontVariant,
  },
};
