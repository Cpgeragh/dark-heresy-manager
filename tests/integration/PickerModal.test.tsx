// tests/integration/PickerModal.test.tsx
import { describe, it, expect, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { PickerModal, PickerRow } from "../../src/ui/PickerModal";

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
    await user.click(screen.getByRole("dialog", { name: "Add Item" })); // backdrop
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

  it("gives interactive picker rows visible pressed feedback", () => {
    const { rerender } = render(<PickerRow>Interactive row</PickerRow>);
    expect(screen.getByRole("button", { name: "Interactive row" })).toHaveClass(
      "active:scale-[0.99]",
      "active:!border-red-400",
      "active:!bg-slate-700",
      "active:ring-1"
    );

    rerender(<PickerRow interactive={false}>Read-only row</PickerRow>);
    expect(screen.getByRole("button", { name: "Read-only row" })).not.toHaveClass(
      "active:scale-[0.99]"
    );
  });

  it("does not treat every enabled button in a picker as a selectable card", () => {
    setup({
      filterRow: <button type="button">Bespoke filter</button>,
      footer: <button type="button" disabled>Disabled action</button>,
    });

    expect(screen.getByRole("dialog", { name: "Add Item" }).className).not.toContain(
      "button:enabled"
    );
    expect(screen.getByRole("button", { name: "Bespoke filter" })).not.toHaveClass(
      "active:!bg-slate-700"
    );
  });

  it("records and restores a supplied scroll position", () => {
    const scrollPositionRef = { current: 75 };
    setup({ scrollPositionRef });

    let scrollContainer = screen.getByTestId("row").parentElement as HTMLElement;
    expect(scrollContainer).toHaveClass("overflow-y-auto");
    expect(scrollContainer.scrollTop).toBe(75);

    scrollContainer.scrollTop = 190;
    fireEvent.scroll(scrollContainer);
    expect(scrollPositionRef.current).toBe(190);

    cleanup();
    setup({ scrollPositionRef });
    scrollContainer = screen.getByTestId("row").parentElement as HTMLElement;
    expect(scrollContainer.scrollTop).toBe(190);
  });
});
