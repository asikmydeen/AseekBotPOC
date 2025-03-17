/**
 * Vitest to Jest compatibility layer
 * 
 * This file maps Vitest functions to their Jest equivalents,
 * allowing tests written for Vitest to run in Jest without modifications.
 */

// Basic test functions
export const describe = global.describe;
export const it = global.it;
export const test = global.test;
export const expect = global.expect;

// Test lifecycle hooks
export const beforeEach = global.beforeEach;
export const afterEach = global.afterEach;
export const beforeAll = global.beforeAll;
export const afterAll = global.afterAll;

// Mock utilities
export const vi = jest;

// Additional test variants
export const fit = global.it.only;
export const xit = global.it.skip;

// Suite variants
export const fdescribe = global.describe.only;
export const xdescribe = global.describe.skip;