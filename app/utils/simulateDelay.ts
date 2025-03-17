/**
 * Simulates network delay by creating a Promise that resolves after the specified time
 * @param ms - The delay time in milliseconds
 * @returns A Promise that resolves after the specified delay
 */
export function simulateDelay(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}