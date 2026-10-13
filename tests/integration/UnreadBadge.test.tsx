// tests/integration/UnreadBadge.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { UnreadBadge } from "../../src/components/chat/UnreadBadge";

describe("UnreadBadge", () => {
  it("shows nothing when there is nothing unread", () => {
    const { container } = render(<UnreadBadge count={0} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the unread count", () => {
    render(<UnreadBadge count={4} />);

    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("caps large counts at 99+", () => {
    render(<UnreadBadge count={250} />);

    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("is hidden from screen readers", () => {
    render(<UnreadBadge count={4} />);

    expect(screen.getByText("4")).toHaveAttribute("aria-hidden", "true");
  });
});
