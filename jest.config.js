/**
 * Jest configuration file
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        useESM: true
      }
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^vitest$': '<rootDir>/test-utils/vitest.ts'
  },
  modulePathIgnorePatterns: ['<rootDir>/aseekbot-bak'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
