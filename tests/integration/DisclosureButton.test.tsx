import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { DisclosureButton } from "../../src/ui/buttons/DisclosureButton";

describe("DisclosureButton", () => {
  it("shows its label and reports whether the content is open", () => {
    render(
      <DisclosureButton expanded={false} onClick={vi.fn()}>
        Archived (2)
      </DisclosureButton>
    );

    expect(screen.getByRole("button", { name: "Archived (2)" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("reports an open state", () => {
    render(
      <DisclosureButton expanded onClick={vi.fn()}>
        Close History
      </DisclosureButton>
    );

    expect(screen.getByRole("button", { name: "Close History" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  it("calls onClick when pressed", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <DisclosureButton expanded={false} onClick={onClick}>
        Stack trace
      </DisclosureButton>
    );

    await user.click(screen.getByRole("button", { name: "Stack trace" }));

    expect(onClick).toHaveBeenCalledOnce();
  });
});
