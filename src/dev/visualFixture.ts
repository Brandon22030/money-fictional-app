import type { IntentionKind, Transaction } from '@/src/domain/types';

export type VisualFixture = {
  transactions: Transaction[];
  dailyDelta: { amountMinor: number; percent: number };
  kindShares: Record<IntentionKind, number>;
  monthly: { in: number; out: number }[];
};

declare global {
  // Injected by the visual harness (scripts/visual/capture.mjs) before the app loads.
  var __ABONDA_VISUAL_FIXTURE__: VisualFixture | undefined;
}

/**
 * Mockup demo content for the visual harness only. Returns undefined unless the web
 * export was built with EXPO_PUBLIC_VISUAL_FIXTURE=1, so real builds never use it.
 */
export function getVisualFixture(): VisualFixture | undefined {
  if (process.env.EXPO_PUBLIC_VISUAL_FIXTURE !== '1') return undefined;
  return globalThis.__ABONDA_VISUAL_FIXTURE__;
}
