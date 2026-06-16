// tests/integration/PickerModal.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { PickerModal } from "../../src/ui/PickerModal";

function setup(overrides: Partial<React.ComponentProps<typeof PickerModal>> = {}) {
  const onClose = vi.fn();
  const onQueryChange = vi.fn();
  render(
    <PickerModal
      title="Add Item"
      query=""
      onQueryChange={onQueryChange}
      onClose={onClose}
      isEmpty={false}
      {...overrides}
    >
      <div data-testid="row">A Row</div>
    </PickerModal>
  );
  return { onClose, onQueryChange };
}

describe("PickerModal", () => {
  it("renders the title and children", () => {
    setup();
    expect(screen.getByText("Add Item")).toBeInTheDocument();
    expect(screen.getByTestId("row")).toBeInTheDocument();
  });

  it("calls onQueryChange when typing in the search box", async () => {
    const user = userEvent.setup();
    const { onQueryChange } = setup();
    await user.type(screen.getByPlaceholderText("Search…"), "las");
    expect(onQueryChange).toHaveBeenCalled();
  });

  it("shows the empty message when isEmpty is true", () => {
    setup({ isEmpty: true, emptyMessage: "Nothing here." });
    expect(screen.getByText("Nothing here.")).toBeInTheDocument();
  });

  it("fires onClose from the close button", async () => {
    const user = userEvent.setup();
    const { onClose } = setup();
    await user.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on backdrop click but not when clicking inside the panel", async () => {
    const user = userEvent.setup();
    const { onClose } = setup();
    await user.click(screen.getByTestId("row")); // inside → stopPropagation
    expect(onClose).not.toHaveBeenCalled();
    await user.click(document.querySelector(".fixed.inset-0")!); // backdrop
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("hides search when hideSearch is set and renders filterRow/footer", () => {
    setup({
      hideSearch: true,
      filterRow: <span>Filter Chips</span>,
      footer: <button>Add custom</button>,
    });
    expect(screen.queryByPlaceholderText("Search…")).not.toBeInTheDocument();
    expect(screen.getByText("Filter Chips")).toBeInTheDocument();
    expect(screen.getByText("Add custom")).toBeInTheDocument();
  });
});
