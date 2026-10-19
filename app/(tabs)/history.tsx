import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { HistoryScreen } from '@/src/features/history/HistoryScreen';
import { useAppStore } from '@/src/store/useAppStore';

export default function HistoryRoute() {
  const markHistoryVisited = useAppStore((state) => state.markHistoryVisited);

  // Every time History comes into focus, the intentions listed there count as seen
  // (clears the bell badge on Home).
  useFocusEffect(
    useCallback(() => {
      markHistoryVisited();
    }, [markHistoryVisited]),
  );

  return <HistoryScreen />;
}
