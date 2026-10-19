import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import { join } from 'path';

import '@/src/i18n';

const APP_DIR = join(__dirname, '..', '..', '..', '..', 'app');

describe('route skeleton', () => {
  it('renders the home placeholder and navigates through the five tabs', async () => {
    await renderRouter(APP_DIR);

    expect(screen.getByTestId('screen-home')).toBeTruthy();

    for (const tab of ['card', 'abundance', 'history', 'settings']) {
      await fireEvent.press(screen.getByTestId(`tab-${tab}`));
      expect(screen.getByTestId(`screen-${tab}`)).toBeTruthy();
    }
  });
});
