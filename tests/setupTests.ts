// tests/setupTests.ts

import "@testing-library/jest-dom";

// jsdom has no ResizeObserver; stub it so components that measure their own
// size don't throw. Tests don't assert on live measured dimensions.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;

// Optional: silence console.logs in tests
// console.log = () => {};
