module.exports = {
  preset: 'jest-expo',
  // Worklets ships `.native.ts` sources that call native TurboModules.
  // Its resolver makes Jest pick the JS (web) implementations instead.
  resolver: 'react-native-worklets/jest/resolver',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/docs/'],
};
