import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { XpCostForm } from "../../src/ui/forms/XpCostForm";

function Harness({
  onSubmit = vi.fn(),
  onClose = vi.fn(),
  showBack = false,
}: {
  onSubmit?: () => void | Promise<unknown>;
  onClose?: () => void;
  showBack?: boolean;
}) {
  const [cost, setCost] = useState("");
  return (
    <XpCostForm
      title="Buy Acrobatics"
      submitLabel="Buy Acrobatics"
      cost={cost}
      onCostChange={setCost}
      onSubmit={onSubmit}
      onClose={onClose}
      showBack={showBack}
    />
  );
}

describe("XpCostForm", () => {
  it("shows a Details box with a required XP Cost field and the Required note", () => {
    render(<Harness />);

    expect(screen.getByRole("heading", { name: "Details" })).toBeInTheDocument();
    expect(screen.getByLabelText(/XP Cost/)).toBeRequired();
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("keeps the submit button off until a cost is typed", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const submit = screen.getByRole("button", { name: "Buy Acrobatics" });
    expect(submit).toBeDisabled();
    await user.type(screen.getByPlaceholderText("0"), "150");
    expect(submit).toBeEnabled();
  });

  it("closes from Cancel, and shows the Back arrow only when asked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { rerender } = render(<Harness onClose={onClose} />);

    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<Harness onClose={onClose} showBack />);
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
  });

  it("shows the button as waiting until the save finishes", async () => {
    const user = userEvent.setup();
    let finish: () => void = () => undefined;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    render(<Harness onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText("0"), "150");
    await user.click(screen.getByRole("button", { name: "Buy Acrobatics" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /Buy Acrobatics/ })).toHaveAttribute(
      "aria-busy",
      "true"
    );

    await act(async () => finish());
    expect(screen.getByRole("button", { name: "Buy Acrobatics" })).not.toHaveAttribute("aria-busy");
  });
});
