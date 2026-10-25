import { renderHook } from '@testing-library/react-native';

import { getDemoTransactions } from '@/src/data/intentions';
import { useHasUnseenIntentions } from '@/src/store/selectors';
import { useAppStore } from '@/src/store/useAppStore';

describe('useHasUnseenIntentions', () => {
  beforeEach(() => {
    useAppStore.getState().resetAll();
    useAppStore.getState().setCurrency('EUR');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('is true on first launch, before any History visit', async () => {
    const { result } = await renderHook(() => useHasUnseenIntentions());
    expect(useAppStore.getState().lastHistoryVisitAt).toBeNull();
    expect(result.current).toBe(true);
  });

  it('ignores demo intentions dated after the last History visit', async () => {
    const now = new Date(2026, 10, 5, 9, 0);
    jest.useFakeTimers({ now, advanceTimers: true });
    const lastVisit = new Date(2026, 9, 19, 9, 0);
    useAppStore.setState({ lastHistoryVisitAt: lastVisit.toISOString() });

    // Precondition: the monthly recomputed demo data does contain an entry after the visit.
    expect(
      getDemoTransactions('EUR', now).some((tx) => new Date(tx.createdAt).getTime() > lastVisit.getTime()),
    ).toBe(true);

    const { result } = await renderHook(() => useHasUnseenIntentions());
    expect(result.current).toBe(false);
  });

  it('is true when a user intention is newer than the last History visit', async () => {
    jest.useFakeTimers({ now: new Date(2026, 10, 5, 9, 0), advanceTimers: true });
    useAppStore.setState({ lastHistoryVisitAt: new Date(2026, 9, 19, 9, 0).toISOString() });
    useAppStore.getState().applyIntention('receive', 100);

    const { result } = await renderHook(() => useHasUnseenIntentions());
    expect(result.current).toBe(true);
  });
});
