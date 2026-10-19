import { act, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { TransactionTicket } from '@/src/components/transactions/TransactionTicket';
import i18n from '@/src/i18n';
import { colors, ticket } from '@/src/theme';

const DATE = new Date(2026, 2, 15, 14, 30);

describe('TransactionTicket', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('fr');
  });

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
    expect(screen.getByText('+10 EUR')).toBeTruthy();
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
    expect(screen.getByText('-3 EUR')).toBeTruthy();
  });

  it('formats the date according to the locale', async () => {
    const { rerender } = await render(
      <TransactionTicket title="A" amountLabel="1" direction="in" date={DATE} locale="fr" />,
    );
    expect(screen.getByText(/mars/)).toBeTruthy();
    expect(screen.queryByText(/2026/)).toBeNull();
    await rerender(
      <TransactionTicket title="A" amountLabel="1" direction="in" date={DATE} locale="en" />,
    );
    expect(screen.getByText(/Mar/)).toBeTruthy();
    expect(screen.queryByText(/mars/)).toBeNull();
  });

  it('shows the kind label in the tab, from the kind or the direction', async () => {
    const { rerender } = await render(
      <TransactionTicket
        title="A"
        amountLabel="1"
        direction="out"
        kind="pay"
        date={DATE}
        locale="fr"
      />,
    );
    expect(screen.getByText('Payé')).toBeTruthy();
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    await rerender(
      <TransactionTicket title="A" amountLabel="1" direction="in" date={DATE} locale="en" />,
    );
    expect(screen.getByText('Received')).toBeTruthy();
    await act(async () => {
      await i18n.changeLanguage('fr');
    });
    await rerender(
      <TransactionTicket
        title="A"
        amountLabel="1"
        direction="in"
        kindLabel="Reçu"
        date={DATE}
        locale="fr"
      />,
    );
    expect(screen.getByText('Reçu')).toBeTruthy();
  });

  it('uses the dayLabel prop and keeps the accessibility label', async () => {
    await render(
      <TransactionTicket
        testID="t"
        title="Gratitude"
        amountLabel="2 500,00 €"
        direction="in"
        dayLabel="Aujourd'hui"
        date={DATE}
        locale="fr"
      />,
    );
    expect(screen.getByText("Aujourd'hui")).toBeTruthy();
    expect(screen.getByTestId('t').props.accessibilityLabel).toBe(
      "Gratitude, Reçu, +2 500,00 €, Aujourd'hui 14:30",
    );
  });

  it.each([
    ['pay', 'Payé'],
    ['withdraw', 'Retiré'],
  ] as const)(
    'reads the %s type label, not the direction, in the accessibility label',
    async (kind, label) => {
      await render(
        <TransactionTicket
          testID="t"
          title="Projet de rêve financé"
          amountLabel="1 200,00 €"
          direction="out"
          kind={kind}
          dayLabel="18 oct."
          date={DATE}
          locale="fr"
        />,
      );
      expect(screen.getByTestId('t').props.accessibilityLabel).toBe(
        `Projet de rêve financé, ${label}, -1 200,00 €, 18 oct. 14:30`,
      );
      expect(screen.getByTestId('t').props.accessibilityLabel).not.toContain('Envoyé');
    },
  );

  it('reads a custom kindLabel in the accessibility label', async () => {
    await render(
      <TransactionTicket
        testID="t"
        title="A"
        amountLabel="1"
        direction="out"
        kind="pay"
        kindLabel="Réglé"
        dayLabel="Hier"
        date={DATE}
        locale="fr"
      />,
    );
    expect(screen.getByTestId('t').props.accessibilityLabel).toBe('A, Réglé, -1, Hier 14:30');
  });
});

type Rgb = [number, number, number];

function parse(color: string): { rgb: Rgb; alpha: number } {
  const rgba = color.match(/^rgba\((\d+),(\d+),(\d+),([\d.]+)\)$/);
  if (rgba)
    return { rgb: [Number(rgba[1]), Number(rgba[2]), Number(rgba[3])], alpha: Number(rgba[4]) };
  const hex = color.replace('#', '');
  return {
    rgb: [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb,
    alpha: 1,
  };
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
    ['in', colors.navy800],
    ['out', colors.navy800],
  ] as const)('uses a contrasted color for %s amounts', async (direction, expected) => {
    await render(
      <TransactionTicket
        title="T"
        amountLabel="1 EUR"
        direction={direction}
        date={DATE}
        locale="fr"
      />,
    );
    const label = `${direction === 'in' ? '+' : '-'}1 EUR`;
    const color = StyleSheet.flatten(screen.getByText(label).props.style).color as string;
    expect(color).toBe(expected);

    for (const stop of ticket.default.colors) {
      expect(contrast(parse(color).rgb, parse(stop).rgb)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
