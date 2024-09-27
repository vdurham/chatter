/*
 * For info, visit:
 * https://jestjs.io/docs/configuration
 */
import type { Config } from 'jest';

const config: Config = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: '.coverage',
  coverageProvider: 'v8',
  preset: 'ts-jest',
  // can change test environment on CLI when running jest */
  testEnvironment: 'node', // this is for backend (server) // 'jsdom' is for frontend (client)
  testMatch: ['**/tests/**/*.test.ts']
};

export default config;
