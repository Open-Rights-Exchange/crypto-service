module.exports = {
  globalSetup: '<rootDir>/test/config/setup.js',
  globalTeardown: '<rootDir>/test/config/teardown.js',
  testEnvironment: '<rootDir>/test/config/mongo-environment.js',
  collectCoverageFrom: ['backend/**/*.{js,jsx}', 'frontend/**/*.{js,jsx}'],
  setupFiles: [
    '<rootDir>/backend/test/config/setup.ts',
    '<rootDir>/backend/test/config/globalMocks.ts',
    '<rootDir>/backend/test/config/constants.ts',
  ],
  testMatch: [
    '<rootDir>/backend/test/**/*[^_](*.)(spec|test).ts?(x)',
    '<rootDir>/server/test/**/*[^_](*.)(spec|test).ts?(x)',
  ],
  testURL: 'http://localhost',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)?$': 'ts-jest',
  },
  transformIgnorePatterns: ['[/\\\\]node_modules[/\\\\].+\\.(js|jsx)$', '[/\\\\]dist[/\\\\].+\\.(ts|js)$'],
  moduleNameMapper: {
    '^analytics-node$': '<rootDir>/backend/test/__mocks__/analytics.js',
    '^axios$': '<rootDir>/backend/test/__mocks__/axios.js',
  },
  moduleFileExtensions: ['web.js', 'js', 'json', 'web.jsx', 'jsx', 'node', 'ts', 'tsx'],
  modulePaths: ['<rootDir>/backend/', '<rootDir>/server/'],
  globals: {
    'ts-jest': {
      diagnostics: {
        warnOnly: true,
      },
    },
  },
}
