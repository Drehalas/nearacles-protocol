/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/near-intent/(.*)$': '<rootDir>/src/near-intent/$1',
    '^@/near-ai/(.*)$': '<rootDir>/src/near-ai/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1'
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testTimeout: 30000,
  verbose: true,
  // Skip platform-specific dependencies that cause issues on Windows
  modulePathIgnorePatterns: [
    'near-workspaces',
    'near-sandbox'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(near-api-js|@near-js)/)'
  ]
};
