module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/tests/integration/', '<rootDir>/tests/e2e/'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup-unit.js']
};
