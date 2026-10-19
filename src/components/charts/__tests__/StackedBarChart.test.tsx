import { render, screen } from '@testing-library/react-native';

import '@/src/i18n';
import { StackedBarChart } from '../StackedBarChart';

const months = ['Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.'];
const legend = { a: 'Reçu', b: 'Donné' };

describe('StackedBarChart', () => {
  it('renders one bar per month with labels and legend', async () => {
    const data = months.map((label, i) => ({ label, a: 10 + i, b: 5 + i }));
    await render(<StackedBarChart data={data} legend={legend} />);

    for (let i = 0; i < months.length; i += 1) {
      expect(screen.getByTestId(`bar-${i}`)).toBeTruthy();
    }
    expect(screen.queryByTestId('bar-6')).toBeNull();
    expect(screen.getByTestId('bar-label-5')).toBeTruthy();
    expect(screen.getByText('Reçu')).toBeTruthy();
    expect(screen.getByText('Donné')).toBeTruthy();
  });

  it('does not crash with empty or all-zero data', async () => {
    await render(<StackedBarChart data={[]} legend={legend} />);
    expect(screen.getByTestId('stacked-bar-chart')).toBeTruthy();
  });

  it('keeps the bars with zero values', async () => {
    await render(
      <StackedBarChart data={months.map((label) => ({ label, a: 0, b: 0 }))} legend={legend} />,
    );
    expect(screen.getByTestId('bar-5')).toBeTruthy();
  });
});
