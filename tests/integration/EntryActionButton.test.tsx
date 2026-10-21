import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { EntryActionButton } from "../../src/ui/buttons/EntryActionButton";

describe("EntryActionButton", () => {
  it("is extra small on phones and gains the two larger responsive sizes", () => {
    render(<EntryActionButton>Edit Rolls</EntryActionButton>);

    expect(screen.getByRole("button", { name: "Edit Rolls" })).toHaveClass(
      "text-xs",
      "sm:h-7",
      "sm:px-2.5",
      "md:h-8",
      "md:px-3",
      "md:text-sm"
    );
  });

  it("keeps a class the caller adds", () => {
    render(<EntryActionButton className="shrink-0">Escalate</EntryActionButton>);

    expect(screen.getByRole("button", { name: "Escalate" })).toHaveClass("shrink-0", "sm:h-7");
  });

  it("calls the handler when pressed", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<EntryActionButton onClick={onClick}>Upgrade to +10</EntryActionButton>);

    await user.click(screen.getByRole("button", { name: "Upgrade to +10" }));

    expect(onClick).toHaveBeenCalledOnce();
  });
});
