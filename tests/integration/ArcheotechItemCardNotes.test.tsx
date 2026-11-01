import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ItemCard } from "../../src/pages/CharacterSheet/ArcheotechTab/ItemCard";
import type { ArcheotechItem } from "../../src/types/Character";

function renderCard(item: ArcheotechItem) {
  render(<ItemCard item={item} editable={false} onRemove={vi.fn()} />);
}

describe("Archeotech item card notes", () => {
  it("shows the creator's item note behind the Notes line once the card is opened", async () => {
    const user = userEvent.setup();
    renderCard({ id: "a1", name: "Relic", type: "Gear", itemNotes: "Only the GM may use it." });

    await user.click(screen.getByRole("button", { name: "Expand Relic details" }));
    await user.click(screen.getByRole("button", { name: "Show information about Relic Notes" }));

    expect(screen.getByRole("dialog", { name: "Relic Notes" })).toHaveTextContent(
      "Only the GM may use it."
    );
  });

  it("still shows a note saved under the old field name", async () => {
    const user = userEvent.setup();
    renderCard({ id: "a2", name: "Relic", type: "Gear", notes: "Found on Hive Tertius." });

    await user.click(screen.getByRole("button", { name: "Expand Relic details" }));
    await user.click(screen.getByRole("button", { name: "Show information about Relic Notes" }));

    expect(screen.getByRole("dialog", { name: "Relic Notes" })).toHaveTextContent(
      "Found on Hive Tertius."
    );
  });
});
