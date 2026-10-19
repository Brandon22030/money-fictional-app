import { renderHook } from '@testing-library/react-native';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  TAB_BAR_CLEARANCE,
  TAB_BAR_HEIGHT,
  tabBarBottom,
  useTabBarClearance,
} from '@/src/components/navigation/tabBarLayout';

function wrapperWithBottomInset(bottom: number) {
  const metrics = {
    frame: { x: 0, y: 0, width: 390, height: 844 },
    insets: { top: 0, left: 0, right: 0, bottom },
  };
  return function Wrapper({ children }: { children: ReactNode }) {
    return <SafeAreaProvider initialMetrics={metrics}>{children}</SafeAreaProvider>;
  };
}

describe('tab bar clearance', () => {
  it('clears the bar height plus a margin', () => {
    expect(TAB_BAR_CLEARANCE).toBeGreaterThan(TAB_BAR_HEIGHT);
  });

  it('adds the bottom safe area inset like the tab bar does', async () => {
    const withInset = await renderHook(() => useTabBarClearance(), { wrapper: wrapperWithBottomInset(34) });
    expect(withInset.result.current).toBe(34 + TAB_BAR_CLEARANCE);
    expect(tabBarBottom(34)).toBe(34);

    const noInset = await renderHook(() => useTabBarClearance(), { wrapper: wrapperWithBottomInset(0) });
    expect(noInset.result.current).toBe(tabBarBottom(0) + TAB_BAR_CLEARANCE);
  });

  it.each([
    'home/HomeScreen.tsx',
    'cardScreen/CardScreen.tsx',
    'abundance/AbundanceScreen.tsx',
    'history/HistoryScreen.tsx',
    'settings/SettingsScreen.tsx',
  ])('is the single source of bottom padding in %s', (file) => {
    const source = readFileSync(join(__dirname, '..', '..', '..', 'features', file), 'utf8');
    expect(source).toContain('useTabBarClearance()');
    expect(source).not.toMatch(/paddingBottom:\s*\d/);
  });
});
