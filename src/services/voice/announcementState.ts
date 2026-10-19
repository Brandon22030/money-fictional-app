import { create } from 'zustand';

/** Shared across screens: the announcement (and its loop) keeps running when the tab changes. */
export const useAnnouncementState = create<{ active: boolean }>(() => ({
  active: false,
}));

export function setAnnouncementActive(active: boolean): void {
  useAnnouncementState.setState({ active });
}

export function useIsAnnouncing(): boolean {
  return useAnnouncementState((state) => state.active);
}

/** Current value, outside React: lets a press handler decide on the real state, not a render's. */
export function isAnnouncing(): boolean {
  return useAnnouncementState.getState().active;
}
