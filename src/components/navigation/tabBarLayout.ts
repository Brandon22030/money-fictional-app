import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout, spacing } from '@/src/theme';

/** Height of one tab item. */
export const TAB_ITEM_SIZE = 52;

/** Full height of the floating tab bar (items plus inner padding). */
export const TAB_BAR_HEIGHT = 68;

/** Free space kept between the last content and the top of the tab bar. */
export const TAB_BAR_CLEARANCE = TAB_BAR_HEIGHT + spacing['4xl'];

/** Distance between the floating tab bar and the bottom of the screen. */
export function tabBarBottom(insetBottom: number): number {
  return Math.max(layout.tabBarBottom, insetBottom - 12);
}

/** Bottom padding that keeps scrollable content clear of the floating tab bar. */
export function useTabBarClearance(): number {
  const { bottom } = useSafeAreaInsets();
  return tabBarBottom(bottom) + TAB_BAR_CLEARANCE;
}
