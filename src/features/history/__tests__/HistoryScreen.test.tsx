import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HistoryScreen } from '@/src/features/history/HistoryScreen';
import { filterEntries, groupByDay, type TransactionEntry } from '@/src/features/history/historyData';
import i18n from '@/src/i18n';
import { useAppStore } from '@/src/store/useAppStore';

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

async function renderScreen() {
  await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <HistoryScreen />
    </SafeAreaProvider>,
  );
}

beforeEach(async () => {
  await act(async () => {
    useAppStore.getState().resetAll();
    useAppStore.getState().setCurrency('EUR');
    useAppStore.getState().setLanguage('fr');
    await i18n.changeLanguage('fr');
  });
});

describe('HistoryScreen', () => {
  it('lists the demo intentions as tickets', async () => {
    await renderScreen();
    expect(screen.getByText('Panier de fruits')).toBeTruthy();
    expect(screen.getByText('Concert en plein air')).toBeTruthy();
  });

  it('filters by translated label', async () => {
    await renderScreen();
    await fireEvent.changeText(screen.getByTestId('history-search'), 'fruits');
    expect(screen.getByText('Panier de fruits')).toBeTruthy();
    expect(screen.queryByText('Concert en plein air')).toBeNull();
  });

  it('filters by amount', async () => {
    await renderScreen();
    await fireEvent.changeText(screen.getByTestId('history-search'), '6000');
    expect(screen.getByText('Panier de fruits')).toBeTruthy();
    expect(screen.queryByText('Concert en plein air')).toBeNull();
  });

  it('shows and finds a shared-with intention by the favorite name', async () => {
    await act(async () => {
      useAppStore.getState().applyIntention('send', 100, {
        labelKey: 'content:intentions.sharedWith',
        labelParams: { contact: 'futureSelf' },
      });
    });
    await renderScreen();
    await fireEvent.changeText(screen.getByTestId('history-search'), 'moi futur');
    expect(screen.getByText('Partagé avec Moi futur')).toBeTruthy();
    expect(screen.queryByText('Panier de fruits')).toBeNull();
  });

  it('shows the empty state when nothing matches', async () => {
    await renderScreen();
    await fireEvent.changeText(screen.getByTestId('history-search'), 'zzzzzz');
    expect(screen.getByTestId('history-empty')).toBeTruthy();
    expect(screen.getByText('Aucune intention ne correspond à votre recherche.')).toBeTruthy();
  });
});

describe('historyData', () => {
  const entry = (id: string, createdAt: string, title: string, amountLabel: string): TransactionEntry => ({
    transaction: { id, kind: 'pay', labelKey: 'x', amountMinor: 1, createdAt },
    title,
    amountLabel,
  });

  it('groups consecutive entries by day', () => {
    const sections = groupByDay([
      entry('a', new Date(2026, 4, 2, 10).toISOString(), 'A', '1'),
      entry('b', new Date(2026, 4, 2, 9).toISOString(), 'B', '2'),
      entry('c', new Date(2026, 4, 1, 9).toISOString(), 'C', '3'),
    ]);
    expect(sections.map((section) => section.data.length)).toEqual([2, 1]);
  });

  it('ignores accents, case and spaces when filtering', () => {
    const entries = [entry('a', new Date().toISOString(), 'Café', '12 500,00 €')];
    expect(filterEntries(entries, 'CAFE')).toHaveLength(1);
    expect(filterEntries(entries, '12500')).toHaveLength(1);
    expect(filterEntries(entries, 'thé')).toHaveLength(0);
  });
});
