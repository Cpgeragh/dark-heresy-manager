// tests/integration/QrModal.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { QrModal } from "../../src/ui/modals/QrModal";

describe("QrModal", () => {
  it("shows a QR code without printing its URL", () => {
    render(
      <QrModal title="Share App" url="https://example.com" onClose={vi.fn()} />
    );
    expect(screen.getByText("Share App")).toBeInTheDocument();
    expect(within(screen.getByRole("dialog", { name: "Share App" })).getByRole("img")).toBeInTheDocument();
    expect(screen.queryByText("https://example.com")).not.toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<QrModal title="Share App" url="https://example.com" onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
