import { fireEvent, render, screen } from '@testing-library/react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { TabBar } from '@/src/components/navigation/TabBar';
import i18n from '@/src/i18n';

const NAMES = ['index', 'card', 'abundance', 'history', 'settings'];

function makeProps(index: number, navigateToTab = jest.fn()) {
  return {
    state: { index, routes: NAMES.map((name) => ({ key: `${name}-k`, name })) },
    descriptors: {},
    navigateToTab,
    insets: { top: 0, bottom: 0, left: 0, right: 0 },
  } as unknown as BottomTabBarProps;
}

describe('TabBar', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('fr');
  });

  it('renders five tabs with the active one selected and labelled', async () => {
    await render(<TabBar {...makeProps(1)} />);
    expect(screen.getAllByRole('tab')).toHaveLength(5);
    expect(screen.getByTestId('tab-card').props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId('tab-index').props.accessibilityState.selected).toBe(false);
    expect(screen.getByLabelText('Accueil')).toBeTruthy();
    expect(screen.getByText('Carte')).toBeTruthy();
    expect(screen.queryByText('Accueil')).toBeNull();
  });

  it('calls navigateToTab with the route key', async () => {
    const navigateToTab = jest.fn();
    await render(<TabBar {...makeProps(0, navigateToTab)} />);
    await fireEvent.press(screen.getByTestId('tab-history'));
    expect(navigateToTab).toHaveBeenCalledWith('history-k');
  });
});
