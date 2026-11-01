import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { EntryQuantityRow } from "../../src/ui/EntryQuantityRow";

describe("EntryQuantityRow", () => {
  it("shows the Quantity label and the counter", () => {
    render(<EntryQuantityRow quantity={4} editable onUpdate={vi.fn()} />);

    expect(screen.getByText("Quantity")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit quantity, currently 4" })).toBeInTheDocument();
  });

  it("passes a changed quantity to onUpdate", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(<EntryQuantityRow quantity={4} editable onUpdate={onUpdate} />);

    await user.click(screen.getByRole("button", { name: "Increase quantity" }));

    expect(onUpdate).toHaveBeenCalledWith(5);
  });

  it("draws no step buttons on a read-only sheet", () => {
    render(<EntryQuantityRow quantity={4} editable={false} onUpdate={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "Increase quantity" })).not.toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("shows a note beside the counter", () => {
    render(
      <EntryQuantityRow quantity={4} editable onUpdate={vi.fn()} note={<span>Kept ready</span>} />
    );

    expect(screen.getByText("Kept ready")).toBeInTheDocument();
  });
});
