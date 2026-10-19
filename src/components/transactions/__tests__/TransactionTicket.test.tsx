import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { TransactionTicket } from '@/src/components/transactions/TransactionTicket';
import '@/src/i18n';
import { colors } from '@/src/theme';

const DATE = new Date(2026, 2, 15, 14, 30);

describe('TransactionTicket', () => {
  it('shows a plus sign for incoming amounts', async () => {
    await render(
      <TransactionTicket
        title="Salaire"
        amountLabel="10 EUR"
        direction="in"
        date={DATE}
        locale="fr"
      />,
    );
    expect(screen.getByText('+ 10 EUR')).toBeTruthy();
    expect(screen.getByText('Salaire')).toBeTruthy();
  });

  it('shows a minus sign for outgoing amounts', async () => {
    await render(
      <TransactionTicket
        title="Cafe"
        amountLabel="3 EUR"
        direction="out"
        date={DATE}
        locale="en"
      />,
    );
    expect(screen.getByText('- 3 EUR')).toBeTruthy();
  });

  it('formats the date according to the locale', async () => {
    const { rerender } = await render(
      <TransactionTicket title="A" amountLabel="1" direction="in" date={DATE} locale="fr" />,
    );
    expect(screen.getByText(/mars/)).toBeTruthy();
    await rerender(
      <TransactionTicket title="A" amountLabel="1" direction="in" date={DATE} locale="en" />,
    );
    expect(screen.getByText(/Mar/)).toBeTruthy();
    expect(screen.queryByText(/mars/)).toBeNull();
  });
});

type Rgb = [number, number, number];

function parse(color: string): { rgb: Rgb; alpha: number } {
  const rgba = color.match(/^rgba\((\d+),(\d+),(\d+),([\d.]+)\)$/);
  if (rgba) return { rgb: [Number(rgba[1]), Number(rgba[2]), Number(rgba[3])], alpha: Number(rgba[4]) };
  const hex = color.replace('#', '');
  return {
    rgb: [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb,
    alpha: 1,
  };
}

function over(top: string, bottom: string): Rgb {
  const { rgb, alpha } = parse(top);
  const base = parse(bottom).rgb;
  return rgb.map((channel, i) => channel * alpha + (base[i] as number) * (1 - alpha)) as Rgb;
}

function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe('TransactionTicket amount contrast', () => {
  it.each([
    ['in', colors.navy700],
    ['out', colors.textOnLightMuted],
  ] as const)('uses a contrasted color for %s amounts', async (direction, expected) => {
    await render(
      <TransactionTicket title="T" amountLabel="1 EUR" direction={direction} date={DATE} locale="fr" />,
    );
    const label = `${direction === 'in' ? '+' : '-'} 1 EUR`;
    const color = StyleSheet.flatten(screen.getByText(label).props.style).color as string;
    expect(color).toBe(expected);

    // glassLight sits on the sky gradient: check against its lightest and darkest stops.
    for (const sky of [colors.skyTop, colors.skyMid, colors.skyBottom]) {
      expect(contrast(parse(color).rgb, over(colors.glassLight, sky))).toBeGreaterThanOrEqual(3);
    }
  });
});
