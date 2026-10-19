import { act, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AbundanceScreen } from '@/src/features/abundance/AbundanceScreen';
import i18n from '@/src/i18n';
import { useAppStore } from '@/src/store/useAppStore';

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

async function renderScreen(balanceMajor: number) {
  await act(async () => {
    useAppStore.getState().resetAll();
    useAppStore.getState().setCurrency('EUR');
    useAppStore.getState().setLanguage('en');
    await i18n.changeLanguage('en');
    useAppStore.getState().setBalance(balanceMajor * 100);
  });
  await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <AbundanceScreen />
    </SafeAreaProvider>,
  );
}

function ringCenterText(): string {
  const [span] = screen.getByTestId('ring-center').children;
  return typeof span === 'string' ? span : (span.props.content as string);
}

describe('AbundanceScreen', () => {
  it('shows a compact million balance at the ring center', async () => {
    await renderScreen(1_000_000);
    expect(ringCenterText()).toBe('1M');
  });

  it('shows a compact thousand balance at the ring center', async () => {
    await renderScreen(186_000);
    expect(ringCenterText()).toBe('186k');
  });

  it('renders six monthly bars and a translated legend', async () => {
    await renderScreen(1000);
    for (let i = 0; i < 6; i += 1) {
      expect(screen.getByTestId(`bar-${i}`)).toBeTruthy();
    }
    expect(screen.queryByTestId('bar-6')).toBeNull();
    expect(screen.getByText('Received')).toBeTruthy();
    expect(screen.getByText('Given')).toBeTruthy();
  });
});
