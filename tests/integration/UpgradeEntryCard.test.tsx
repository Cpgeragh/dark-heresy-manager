import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { UpgradeEntryCard } from "../../src/ui/UpgradeEntryCard";

function renderCard(editable = true) {
  const onRemove = vi.fn();
  render(
    <UpgradeEntryCard
      name="Mono-edge"
      removeFrom="this weapon"
      editable={editable}
      onRemove={onRemove}
      chips={<span>Chips</span>}
      rules={<p>Cuts through armour.</p>}
    />
  );
  return { onRemove };
}

describe("UpgradeEntryCard", () => {
  it("shows a Rules line whose icon opens the rules", async () => {
    const user = userEvent.setup();
    renderCard();

    expect(screen.getByText("Rules")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show information about Mono-edge" }));

    expect(screen.getByRole("dialog", { name: "Mono-edge" })).toHaveTextContent(
      "Cuts through armour."
    );
  });

  it("asks before removing the upgrade", async () => {
    const user = userEvent.setup();
    const { onRemove } = renderCard();

    await user.click(screen.getByRole("button", { name: "Remove Mono-edge" }));

    expect(onRemove).not.toHaveBeenCalled();
  });

  it("draws no Remove button on a read-only sheet", () => {
    renderCard(false);

    expect(screen.queryByRole("button", { name: "Remove Mono-edge" })).not.toBeInTheDocument();
  });
});
