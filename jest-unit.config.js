module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  testMatch: ['**/tests/unit/**/*.spec.(ts|js)|**/__tests__/*.(ts|js)'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testPathIgnorePatterns: ['/dist/', 'node_modules', '/docs/'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/cache/**',
    '!**/coverage/**',
    '!**/src/static/**',
  ],
  coverageDirectory: 'tests/unit/coverage',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup.ts'],
};
