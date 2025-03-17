require('@testing-library/jest-dom');

// Map Vitest globals to Jest for compatibility
global.vi = {
  // Core mocking utilities
  fn: jest.fn,
  spyOn: jest.spyOn,
  mock: jest.mock,
  doMock: jest.doMock,
  unmock: jest.unmock,
  deepUnmock: jest.unmock,

  // Timer utilities
  useFakeTimers: jest.useFakeTimers,
  useRealTimers: jest.useRealTimers,
  runOnlyPendingTimers: jest.runOnlyPendingTimers,
  runAllTimers: jest.runAllTimers,
  runAllTicks: jest.runAllTicks,
  advanceTimersByTime: jest.advanceTimersByTime,
  advanceTimersToNextTimer: jest.advanceTimersToNextTimer,

  // Mock reset utilities
  clearAllMocks: jest.clearAllMocks,
  resetAllMocks: jest.resetAllMocks,
  restoreAllMocks: jest.restoreAllMocks,

  // Additional utilities
  stubGlobal: (name, value) => {
    const original = global[name];
    global[name] = value;
    return {
      mockRestore: () => {
        global[name] = original;
      }
    };
  }
};

// Ensure compatibility with Vitest's expect extensions
if (!expect.toHaveBeenCalledTimes && expect.hasOwnProperty('assertions')) {
  Object.defineProperty(expect, 'toHaveBeenCalledTimes', {
    get: () => expect.toBeCalledTimes
  });

  Object.defineProperty(expect, 'toHaveBeenCalled', {
    get: () => expect.toBeCalled
  });

  Object.defineProperty(expect, 'toHaveBeenCalledWith', {
    get: () => expect.toBeCalledWith
  });
}
