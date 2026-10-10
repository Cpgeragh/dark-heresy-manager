// tests/integration/FilterButton.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { describe, expect, it, vi } from "vitest";
import { FilterButton } from "../../src/ui/pickers/FilterButton";

describe("FilterButton", () => {
  it("centres its words inside the card border and fill, with no arrow", () => {
    render(<FilterButton onClick={() => undefined}>All Classes</FilterButton>);

    const button = screen.getByRole("button", { name: "All Classes" });
    expect(button).toHaveClass("text-center", "rounded-lg", "border-slate-500", "bg-slate-900/60");
    expect(button.querySelector("svg")).toBeNull();
  });

  it("calls onClick when pressed", async () => {
    const onClick = vi.fn();
    render(<FilterButton onClick={onClick}>Show all</FilterButton>);

    await userEvent.click(screen.getByRole("button", { name: "Show all" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("adds the width class the caller passes", () => {
    render(
      <FilterButton className="w-full" onClick={() => undefined}>
        All Types
      </FilterButton>
    );

    expect(screen.getByRole("button", { name: "All Types" })).toHaveClass("w-full");
  });
});
