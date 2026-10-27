module.exports = {
  testEnvironment: 'node',
  globalSetup: './tests/globalSetup.js',
  setupFilesAfterEnv: ['./tests/jest.setup.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/index.js'],
  coverageThreshold: {
    global: {
      statements: 60,
      lines: 60,
    },
  },
};
