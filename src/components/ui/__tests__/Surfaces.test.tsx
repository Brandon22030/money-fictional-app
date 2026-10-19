import { render, screen } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';

import { NavyCard } from '@/src/components/ui/NavyCard';
import { Pill } from '@/src/components/ui/Pill';
import { RoundIconButton } from '@/src/components/ui/RoundIconButton';
import { TicketCard } from '@/src/components/ui/TicketCard';
import { colors } from '@/src/theme';

describe('TicketCard', () => {
  it('renders the navy tab label and its children', async () => {
    await render(
      <TicketCard tab="Reçu">
        <Text>Contenu</Text>
      </TicketCard>,
    );

    expect(screen.getByTestId('ticket-tab')).toHaveTextContent('Reçu');
    expect(screen.getByTestId('ticket-tab')).toHaveStyle({ backgroundColor: colors.navy800 });
    expect(screen.getByText('Contenu')).toBeTruthy();
  });

  it('omits the tab when no label is given', async () => {
    await render(<TicketCard variant="affirmation" />);

    expect(screen.queryByTestId('ticket-tab')).toBeNull();
  });
});

describe('Pill', () => {
  it('renders the label with the given color', async () => {
    await render(<Pill testID="pill" label="+4,73 %" icon="up" color="#A9CFF5" />);

    expect(screen.getByText('+4,73 %')).toHaveStyle({ color: '#A9CFF5' });
  });

  it('defaults to white text', async () => {
    await render(<Pill label="Aujourd'hui" />);

    expect(screen.getByText("Aujourd'hui")).toHaveStyle({ color: colors.textOnDark });
  });
});

describe('RoundIconButton', () => {
  it('shows the notification dot only when badge is set', async () => {
    await render(
      <RoundIconButton testID="bell" icon="bell" accessibilityLabel="Notifications" badge />,
    );

    expect(screen.getByTestId('bell-badge')).toHaveStyle({ width: 8, height: 8 });
  });

  it('has no dot by default', async () => {
    await render(<RoundIconButton testID="menu" icon="menu" accessibilityLabel="Menu" />);

    expect(screen.queryByTestId('menu-badge')).toBeNull();
  });
});

describe('NavyCard', () => {
  function layers() {
    const content = screen.getByText('Contenu').parent?.parent;
    const card = content?.parent;
    const outer = screen.getByTestId('navy');
    return { outer, card, content };
  }

  it('sizes to its content by default', async () => {
    await render(
      <NavyCard testID="navy">
        <Text>Contenu</Text>
      </NavyCard>,
    );
    const { outer, card, content } = layers();
    for (const layer of [outer, card, content]) {
      expect(StyleSheet.flatten(layer?.props.style)?.flexGrow).toBeUndefined();
    }
  });

  it('grows every layer to the parent height with fill', async () => {
    await render(
      <NavyCard testID="navy" fill contentStyle={{ padding: 20 }}>
        <Text>Contenu</Text>
      </NavyCard>,
    );
    const { outer, card, content } = layers();
    for (const layer of [outer, card, content]) {
      expect(StyleSheet.flatten(layer?.props.style)).toMatchObject({ flexGrow: 1 });
    }
    expect(StyleSheet.flatten(content?.props.style)).toMatchObject({ padding: 20 });
  });
});

describe('Pill overflow', () => {
  it('keeps a long label on one shrinkable line inside the container width', async () => {
    await render(<Pill testID="p" label="+4 999 999 999 999 FCFA aujourd'hui" />);
    const label = screen.getByText("+4 999 999 999 999 FCFA aujourd'hui");
    expect(label.props.numberOfLines).toBe(1);
    expect(label.props.adjustsFontSizeToFit).toBe(true);
    expect(StyleSheet.flatten(screen.getByTestId('p').props.style).maxWidth).toBe('100%');
  });
});
