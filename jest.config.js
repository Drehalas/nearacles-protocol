/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],

  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/tests/**/*.test.ts'
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
  coverageReporters: ['text', 'lcov'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  testTimeout: 30000,
  verbose: false,
  // Skip tests that require near-workspaces (Windows incompatible)
  testPathIgnorePatterns: [
    'solver-registry.test.ts',
    'intent-manager.test.ts', 
    'end-to-end.test.ts',
    'verifier-contract.test.ts'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(near-api-js|@near-js)/)'
  ]
};