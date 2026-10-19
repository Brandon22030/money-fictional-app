import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import i18n from '@/src/i18n';

import { NumericKeypad } from '../NumericKeypad';

describe('NumericKeypad', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('fr');
    jest.clearAllMocks();
  });

  it('renders the 12 keys with translated labels', async () => {
    await render(<NumericKeypad onKey={jest.fn()} decimalEnabled />);

    for (const digit of ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']) {
      expect(screen.getByLabelText(digit)).toBeOnTheScreen();
    }
    expect(screen.getByLabelText('Virgule')).toBeOnTheScreen();
    expect(screen.getByLabelText('Effacer')).toBeOnTheScreen();
  });

  it('calls onKey with the pressed key and triggers a light haptic', async () => {
    const onKey = jest.fn();
    await render(<NumericKeypad onKey={onKey} decimalEnabled />);

    await fireEvent.press(screen.getByLabelText('7'));
    await fireEvent.press(screen.getByLabelText('Virgule'));
    await fireEvent.press(screen.getByLabelText('Effacer'));

    expect(onKey.mock.calls).toEqual([['7'], ['decimal'], ['backspace']]);
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
  });

  it('does not fire the decimal key when disabled', async () => {
    const onKey = jest.fn();
    await render(<NumericKeypad onKey={onKey} decimalEnabled={false} />);

    await fireEvent.press(screen.getByLabelText('Virgule'));

    expect(onKey).not.toHaveBeenCalled();
  });

  it('shows the separator of the current language', async () => {
    await i18n.changeLanguage('en');
    await render(<NumericKeypad onKey={jest.fn()} decimalEnabled />);

    expect(screen.getByLabelText('Decimal point')).toHaveTextContent('.');
  });
});
