/* eslint-disable @typescript-eslint/no-require-imports -- jest.mock factories need require */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn(async () => false),
  getAvailableVoicesAsync: jest.fn(async () => []),
}));

jest.mock('expo-audio', () => ({
  useAudioPlayer: jest.fn(() => ({ play: jest.fn(), pause: jest.fn(), seekTo: jest.fn() })),
  createAudioPlayer: jest.fn(() => ({ play: jest.fn(), pause: jest.fn(), remove: jest.fn() })),
  setAudioModeAsync: jest.fn(async () => undefined),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(async () => undefined),
  notificationAsync: jest.fn(async () => undefined),
  selectionAsync: jest.fn(async () => undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return { BlurView: View };
});

// The Reanimated 4.5 mock does not export useReducedMotion. expo-router's testing-library
// re-registers this same mock module, so patch the shared module object instead of re-mocking.
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
require('react-native-reanimated/mock').useReducedMotion = jest.fn(() => false);

// RNTL 13 (the version matching expo-router 57 `renderRouter`) fires events synchronously, while
// the tests are written against the async RNTL API: `await fireEvent.press(...)` must also flush
// the async work started by the handler (state updates, resolved promises) before asserting.
jest.mock('@testing-library/react-native', () => {
  const rntl = jest.requireActual('@testing-library/react-native');
  const flush = () => rntl.act(async () => undefined);
  const wrap =
    (fire: (...args: unknown[]) => unknown) =>
    async (...args: unknown[]) => {
      const result = fire(...args);
      await flush();
      return result;
    };
  const fireEvent = Object.assign(
    wrap(rntl.fireEvent),
    Object.fromEntries(
      Object.entries(rntl.fireEvent).map(([name, fire]) => [
        name,
        wrap(fire as (...args: unknown[]) => unknown),
      ]),
    ),
  );
  // Copy descriptors so live bindings such as `screen` stay live.
  return Object.defineProperties({}, {
    ...Object.getOwnPropertyDescriptors(rntl),
    fireEvent: { value: fireEvent, enumerable: true },
  });
});

// renderRouter renders synchronously with RNTL 13: flush the async startup work (store
// hydration, navigation state) so that `await renderRouter(...)` resolves on a settled tree.
jest.mock('expo-router/testing-library', () => {
  const actual = jest.requireActual('expo-router/testing-library');
  const { act } = jest.requireActual('@testing-library/react-native');
  return Object.defineProperties(
    {},
    {
      ...Object.getOwnPropertyDescriptors(actual),
      renderRouter: {
        enumerable: true,
        value: async (...args: unknown[]) => {
          const result = actual.renderRouter(...args);
          await act(async () => undefined);
          return result;
        },
      },
    },
  );
});
