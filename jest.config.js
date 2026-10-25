module.exports = {
  preset: 'jest-expo',
  // Reanimated 4 / worklets ship `.native.ts` sources that call native TurboModules.
  // Their resolver makes Jest pick the JS (web) implementations instead.
  resolver: 'react-native-reanimated/jest/resolver',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/docs/'],
};
