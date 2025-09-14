module.exports = {
  testEnvironment: 'node',
  transform: { '^.+\\.(ts|tsx)$': 'ts-jest' },
  globals: { 'ts-jest': { tsconfig: '<rootDir>/tsconfig.test.json' } },
  roots: ['<rootDir>/utils', '<rootDir>/src', '<rootDir>/routes', '<rootDir>/db'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: ['src/**/*.ts', 'routes/**/*.ts', 'utils/**/*.ts', 'db/**/*.ts', '!**/build/**', '!**/*.test.ts'],
};
