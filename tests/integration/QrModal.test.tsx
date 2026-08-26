// tests/integration/QrModal.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { QrModal } from "../../src/ui/QrModal";

describe("QrModal", () => {
  it("shows the title and the URL as text", () => {
    render(<QrModal title="Share App" url="https://example.com" onClose={vi.fn()} />);
    expect(screen.getByText("Share App")).toBeInTheDocument();
    expect(screen.getByText("https://example.com")).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<QrModal title="Share App" url="https://example.com" onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
