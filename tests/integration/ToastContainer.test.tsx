// tests/integration/ToastContainer.test.tsx
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

const useToastsMock = vi.fn();
vi.mock("../../src/components/Toast/ToastContext", () => ({
  useToasts: () => useToastsMock(),
}));

vi.mock("../../src/components/Toast/ToastItem", () => ({
  ToastItem: ({ toast }: { toast: { id: string; message: string } }) => (
    <div>Mock ToastItem: {toast.message}</div>
  ),
}));

import { ToastContainer } from "../../src/components/Toast/ToastContainer";
import { MODAL_OPENED_EVENT } from "../../src/ui/modals/ModalShell";

const originalShowPopover = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "showPopover");
const originalHidePopover = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "hidePopover");
const showPopover = vi.fn();
const hidePopover = vi.fn();

describe("ToastContainer", () => {
  beforeEach(() => {
    showPopover.mockClear();
    hidePopover.mockClear();
    Object.defineProperty(HTMLElement.prototype, "showPopover", {
      configurable: true,
      value: showPopover,
    });
    Object.defineProperty(HTMLElement.prototype, "hidePopover", {
      configurable: true,
      value: hidePopover,
    });
  });

  afterEach(() => {
    if (originalShowPopover) {
      Object.defineProperty(HTMLElement.prototype, "showPopover", originalShowPopover);
    } else {
      delete (HTMLElement.prototype as Partial<HTMLElement>).showPopover;
    }
    if (originalHidePopover) {
      Object.defineProperty(HTMLElement.prototype, "hidePopover", originalHidePopover);
    } else {
      delete (HTMLElement.prototype as Partial<HTMLElement>).hidePopover;
    }
  });

  it("renders nothing when there are no toasts", () => {
    useToastsMock.mockReturnValue([]);
    const { container } = render(<ToastContainer />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders one ToastItem per toast", () => {
    useToastsMock.mockReturnValue([
      { id: "t1", message: "First" },
      { id: "t2", message: "Second" },
    ]);
    render(<ToastContainer />);

    expect(screen.getByText("Mock ToastItem: First")).toBeInTheDocument();
    expect(screen.getByText("Mock ToastItem: Second")).toBeInTheDocument();
    expect(showPopover).toHaveBeenCalledOnce();
  });

  it("enters the top layer when the first toast is added", () => {
    useToastsMock.mockReturnValue([]);
    const { rerender } = render(<ToastContainer />);
    expect(showPopover).not.toHaveBeenCalled();

    useToastsMock.mockReturnValue([{ id: "t1", message: "First" }]);
    rerender(<ToastContainer />);

    expect(showPopover).toHaveBeenCalledOnce();
  });

  it("raises an existing toast layer when a modal opens", () => {
    useToastsMock.mockReturnValue([{ id: "t1", message: "First" }]);
    render(<ToastContainer />);
    showPopover.mockClear();
    hidePopover.mockClear();

    window.dispatchEvent(new Event(MODAL_OPENED_EVENT));

    expect(hidePopover).toHaveBeenCalledOnce();
    expect(showPopover).toHaveBeenCalledOnce();
  });
});
