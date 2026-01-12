import '@testing-library/jest-dom/vitest';
import { vi, beforeEach, afterEach } from 'vitest';

// Reset all mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

// Ensure timers are always restored after each test
// This prevents fake timers from leaking between tests
afterEach(() => {
  vi.useRealTimers();
});
