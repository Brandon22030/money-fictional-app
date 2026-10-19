const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // Untracked local folders (agent task notes, temporary scripts) are never linted.
    ignores: ['dist/*', '.expo/*', 'node_modules/*', 'docs/*', '.agents/**', '.claude/**'],
  },
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'expo-sharing', message: 'Sharing the balance is forbidden (store compliance).' },
            { name: 'react-native-view-shot', message: 'Capturing the balance is forbidden (store compliance).' },
            { name: 'expo-media-library', message: 'Exporting the balance is forbidden (store compliance).' },
            { name: 'expo-print', message: 'Printing the balance is forbidden (store compliance).' },
            {
              name: 'react-native',
              importNames: ['Share'],
              message: 'Sharing the balance is forbidden (store compliance).',
            },
          ],
        },
      ],
    },
  },
]);
