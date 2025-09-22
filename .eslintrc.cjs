const baseConfig = require('./.config/eslint.cjs');

module.exports = {
  ...baseConfig,
  rules: {
    ...(baseConfig.rules ?? {}),
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          '**/../*/src/**',
          '**/../../*/src/**',
          '**/../../../*/src/**'
        ],
        message:
          'Import from the package public API (e.g., @cks/auth) instead of another package\'s src/.'
      }
    ]
  }
};
