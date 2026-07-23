import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Tooltip } from "../../src/components/Tooltip";

function rect(values: Partial<DOMRect>): DOMRect {
  return {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    toJSON: () => ({}),
    ...values,
  };
}

describe("Tooltip", () => {
  afterEach(() => vi.restoreAllMocks());

  it("positions the tooltip after opening and closes it from an outside click", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement
    ) {
      return this.tagName === "BUTTON"
        ? rect({ left: 24, top: 10, right: 64, bottom: 30, width: 40, height: 20 })
        : rect({ width: 100, height: 40 });
    });

    const user = userEvent.setup();
    render(
      <div>
        <Tooltip content="Additional rules">Rules</Tooltip>
        <button type="button">Outside</button>
      </div>
    );

    await user.click(screen.getByRole("button", { name: "Show additional information" }));

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveStyle({ left: "24px", top: "38px", visibility: "visible" });

    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
