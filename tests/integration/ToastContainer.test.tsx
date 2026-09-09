// tests/integration/ToastContainer.test.tsx
import { describe, it, expect, vi } from "vitest";
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

describe("ToastContainer", () => {
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
  });
});
