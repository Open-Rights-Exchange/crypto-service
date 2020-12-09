module.exports = {
  globalSetup: '<rootDir>/config/jest/setup.js',
  globalTeardown: '<rootDir>/config/jest/teardown.js',
  testEnvironment: '<rootDir>/config/jest/mongo-environment.js',
  collectCoverageFrom: ['backend/**/*.{js,jsx}', 'frontend/**/*.{js,jsx}'],
  setupFiles: [
    '<rootDir>/config/polyfills.js',
    '<rootDir>/backend/test/config/setup.ts',
    '<rootDir>/backend/test/config/globalMocks.ts',
    '<rootDir>/backend/test/config/constants.ts',
  ],
  testMatch: ['<rootDir>/backend/test/[^_](*.)(spec|test).ts?(x)'],
  testURL: 'http://localhost',
  transform: {
    '^.+\\.(js|jsx)$': '<rootDir>/node_modules/babel-jest',
    '^.+\\.css$': '<rootDir>/config/jest/cssTransform.js',
    '^(?!.*\\.(js|jsx|ts|css|json)$)': '<rootDir>/config/jest/fileTransform.js',
    '^.+\\.(ts|tsx)?$': 'ts-jest',
  },
  transformIgnorePatterns: ['[/\\\\]node_modules[/\\\\].+\\.(js|jsx)$', '[/\\\\]dist[/\\\\].+\\.(ts|js)$'],
  moduleNameMapper: {
    '^react-native$': 'react-native-web',
    // TODO: This "manual mock" has to be replaced by "auto mocks" at the test level
    // NOTE: This allows for mock override via jest.requireActual
    // NOTE: Which allows us to actually use the crypo portion of Orejs
    // NOTE: However, before that can happen, this issue needs to be resolved...
    // NOTE: https://github.com/EOSIO/eosjs/issues/450
    '^@google-cloud/storage$': '<rootDir>/backend/test/__mocks__/storage.js',
    '^analytics-node$': '<rootDir>/backend/test/__mocks__/analytics.js',
    '^axios$': '<rootDir>/backend/test/__mocks__/axios.js',
  },
  moduleFileExtensions: ['web.js', 'js', 'json', 'web.jsx', 'jsx', 'node', 'ts', 'tsx'],
  modulePaths: ['<rootDir>/frontend/'],
  globals: {
    'ts-jest': {
      diagnostics: {
        warnOnly: true,
      },
    },
  },
}
