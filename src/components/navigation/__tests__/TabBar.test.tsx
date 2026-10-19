import { fireEvent, render, screen } from '@testing-library/react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { TabBar } from '@/src/components/navigation/TabBar';
import i18n from '@/src/i18n';

const NAMES = ['index', 'card', 'abundance', 'history', 'settings'];

function makeProps(index: number, emit = jest.fn(() => ({ defaultPrevented: false }))) {
  const navigate = jest.fn();
  return {
    props: {
      state: { index, routes: NAMES.map((name) => ({ key: `${name}-k`, name })) },
      descriptors: {},
      navigation: { emit, navigate },
      insets: { top: 0, bottom: 0, left: 0, right: 0 },
    } as unknown as BottomTabBarProps,
    emit,
    navigate,
  };
}

describe('TabBar', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('fr');
  });

  it('renders five tabs with the active one selected and labelled', async () => {
    await render(<TabBar {...makeProps(1).props} />);
    expect(screen.getAllByRole('tab')).toHaveLength(5);
    expect(screen.getByTestId('tab-card').props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId('tab-index').props.accessibilityState.selected).toBe(false);
    expect(screen.getByLabelText('Accueil')).toBeTruthy();
    expect(screen.getByText('Carte')).toBeTruthy();
    expect(screen.queryByText('Accueil')).toBeNull();
  });

  it('emits tabPress then navigates to the pressed inactive tab', async () => {
    const { props, emit, navigate } = makeProps(0);
    await render(<TabBar {...props} />);
    await fireEvent.press(screen.getByTestId('tab-history'));
    expect(emit).toHaveBeenCalledWith({
      type: 'tabPress',
      target: 'history-k',
      canPreventDefault: true,
    });
    expect(navigate).toHaveBeenCalledWith('history', undefined);
  });

  it('does not navigate when the active tab is pressed', async () => {
    const { props, navigate } = makeProps(3);
    await render(<TabBar {...props} />);
    await fireEvent.press(screen.getByTestId('tab-history'));
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not navigate when tabPress is default prevented', async () => {
    const { props, emit, navigate } = makeProps(
      0,
      jest.fn(() => ({ defaultPrevented: true })),
    );
    await render(<TabBar {...props} />);
    await fireEvent.press(screen.getByTestId('tab-history'));
    expect(emit).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
  });
});
