import { render, screen } from '@testing-library/react-native';

import { AmountText } from '@/src/components/ui/AmountText';
import { colors } from '@/src/theme';

describe('AmountText', () => {
  it('renders integer and decimals in two distinct Text nodes', async () => {
    await render(<AmountText integer="1 000 000" decimals=",00" suffix="€" />);

    const integer = screen.getByTestId('amount-integer');
    const decimals = screen.getByTestId('amount-decimals');
    expect(integer).not.toBe(decimals);
    expect(integer).toHaveTextContent('1 000 000');
    expect(decimals).toHaveTextContent(',00');
  });

  it('mutes the decimals and keeps the integer white', async () => {
    await render(<AmountText integer="42" decimals=",50" />);

    expect(screen.getByTestId('amount-integer')).toHaveStyle({ color: colors.textOnDark });
    expect(screen.getByTestId('amount-decimals')).toHaveStyle({ color: colors.textOnDarkMuted });
  });

  it('omits the decimals node when there are none', async () => {
    await render(<AmountText integer="500" />);

    expect(screen.queryByTestId('amount-decimals')).toBeNull();
  });
});
