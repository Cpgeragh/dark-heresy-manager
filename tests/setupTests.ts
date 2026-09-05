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

// jsdom doesn't implement <dialog>'s showModal()/close(), used directly via
// ref by InfoModal, WeaponTrainingTab's exotic-weapon modal, etc. Stub them
// to toggle the `open` attribute/fire the close event like a real browser.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
}
if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}
