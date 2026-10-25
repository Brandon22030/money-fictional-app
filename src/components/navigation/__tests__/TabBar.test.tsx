import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { StyleSheet } from 'react-native';

import {
  LABEL_MAX_FONT_SIZE_MULTIPLIER,
  LABEL_MIN_FONT_SCALE,
  TabBar,
} from '@/src/components/navigation/TabBar';
import i18n from '@/src/i18n';

const NAMES = ['index', 'card', 'abundance', 'history', 'settings'];

function makeProps(index: number) {
  const navigateToTab = jest.fn();
  return {
    props: {
      state: { index, routes: NAMES.map((name) => ({ key: `${name}-k`, name })) },
      descriptors: {},
      navigateToTab,
      insets: { top: 0, bottom: 0, left: 0, right: 0 },
    } as unknown as BottomTabBarProps,
    navigateToTab,
  };
}

describe('TabBar', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('fr');
  });

  // Each TabItem starts a 260 ms Animated.timing on mount, driven by requestAnimationFrame
  // (a setTimeout in tests). Drive it with fake timers and run it to completion inside act,
  // so that its Animated.View updates never land outside act after the test.
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(async () => {
    await act(async () => {
      jest.runAllTimers();
    });
    jest.useRealTimers();
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

  it.each([
    ['Accueil', 0],
    ['Carte', 1],
    ['Abondance', 2],
    ['Historique', 3],
    ['Réglages', 4],
  ])('keeps the active label %s inside the pill', async (label, index) => {
    await render(<TabBar {...makeProps(index).props} />);
    const text = screen.getByText(label);
    // One line, shrunk to fit (down to 80 %) rather than overflowing the pill, and a capped
    // system font scale so a large accessibility font cannot push it out either.
    expect(text.props.numberOfLines).toBe(1);
    expect(text.props.adjustsFontSizeToFit).toBe(true);
    expect(text.props.minimumFontScale).toBe(LABEL_MIN_FONT_SCALE);
    expect(LABEL_MIN_FONT_SCALE).toBeCloseTo(0.8);
    expect(text.props.maxFontSizeMultiplier).toBe(LABEL_MAX_FONT_SIZE_MULTIPLIER);
    expect(LABEL_MAX_FONT_SIZE_MULTIPLIER).toBe(1.2);
    expect(text.props.allowFontScaling).not.toBe(false);
    // Every box between the pill and the label may shrink, so the label gets the pill width.
    const labelWrap = text.parent;
    const content = labelWrap?.parent;
    expect(StyleSheet.flatten(labelWrap?.props.style)).toMatchObject({ flexShrink: 1, minWidth: 0 });
    expect(StyleSheet.flatten(content?.props.style)).toMatchObject({ flexShrink: 1, minWidth: 0 });
    expect(StyleSheet.flatten(text.props.style).flexShrink ?? 1).not.toBe(0);
  });

  it('delegates the press on a tab to navigateToTab with the route key', async () => {
    const { props, navigateToTab } = makeProps(0);
    await render(<TabBar {...props} />);
    await fireEvent.press(screen.getByTestId('tab-history'));
    expect(navigateToTab).toHaveBeenCalledTimes(1);
    expect(navigateToTab).toHaveBeenCalledWith('history-k');
  });

  it('also delegates the press on the active tab, navigateToTab decides what to do', async () => {
    const { props, navigateToTab } = makeProps(3);
    await render(<TabBar {...props} />);
    await fireEvent.press(screen.getByTestId('tab-history'));
    expect(navigateToTab).toHaveBeenCalledWith('history-k');
  });

  it('delegates each tab press with its own route key', async () => {
    const { props, navigateToTab } = makeProps(0);
    await render(<TabBar {...props} />);
    for (const name of NAMES.slice(1)) {
      await fireEvent.press(screen.getByTestId(`tab-${name}`));
      expect(navigateToTab).toHaveBeenLastCalledWith(`${name}-k`);
    }
    expect(navigateToTab).toHaveBeenCalledTimes(NAMES.length - 1);
  });
});
