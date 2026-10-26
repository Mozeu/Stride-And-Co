module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/tests/integration/'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup-unit.js']
};
