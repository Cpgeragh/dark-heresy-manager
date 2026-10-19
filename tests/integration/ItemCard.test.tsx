// tests/integration/ItemCard.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ItemCard } from "../../src/pages/CharacterSheet/ArcheotechTab/ItemCard";
import type { ArcheotechItem } from "../../src/types/Character";

const itemWithNotes: ArcheotechItem = {
  id: "a1",
  name: "Digi-weapon",
  type: "Weapon",
  description: "A tiny concealed blade fitted to a ring.",
  notes: "Found on the hive ship.",
  weight: "0.1 kg",
  value: "500 Thrones",
  availability: "Rare",
};

const itemWithoutNotes: ArcheotechItem = {
  id: "a2",
  name: "Combi-tool",
  type: "Gear",
  weight: "1 kg",
  value: "200 Thrones",
  availability: "Scarce",
};

function renderCard(item: ArcheotechItem, editable = true) {
  const onRemove = vi.fn();
  render(<ItemCard item={item} editable={editable} onRemove={onRemove} />);
  return { onRemove };
}

describe("ItemCard with notes", () => {
  it("starts collapsed with an expand button and hides the notes", () => {
    renderCard(itemWithNotes);
    const header = screen.getByRole("button", { name: "Expand Digi-weapon details" });
    expect(header).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Found on the hive ship.")).not.toBeInTheDocument();
  });

  it("shows the Rules and Notes lines when the header is clicked", async () => {
    const user = userEvent.setup();
    renderCard(itemWithNotes);
    await user.click(screen.getByRole("button", { name: "Expand Digi-weapon details" }));
    expect(screen.getByText("Found on the hive ship.")).toBeInTheDocument();
    expect(screen.getByText("Rules").parentElement).toHaveTextContent("Rules-");
  });

  it("collapses again on a second click", async () => {
    const user = userEvent.setup();
    renderCard(itemWithNotes);
    await user.click(screen.getByRole("button", { name: "Expand Digi-weapon details" }));
    await user.click(screen.getByRole("button", { name: "Collapse Digi-weapon details" }));
    expect(screen.queryByText("Found on the hive ship.")).not.toBeInTheDocument();
  });

  it("shows the description behind an information button beside the name", () => {
    renderCard(itemWithNotes);
    expect(
      screen.getByRole("button", { name: "Show information about Digi-weapon" })
    ).toBeInTheDocument();
    expect(screen.queryByText("A tiny concealed blade fitted to a ring.")).not.toBeInTheDocument();
  });
});

describe("ItemCard without notes", () => {
  it("renders a flat row with no expand button", () => {
    renderCard(itemWithoutNotes);
    expect(
      screen.queryByRole("button", { name: "Expand Combi-tool details" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Combi-tool")).toBeInTheDocument();
  });

  it("shows an information button beside the name and the Rules line without opening anything", () => {
    renderCard(itemWithoutNotes);
    expect(
      screen.getByRole("button", { name: "Show information about Combi-tool" })
    ).toBeInTheDocument();
    expect(screen.getByText("Rules").parentElement).toHaveTextContent("Rules-");
  });

  it("shows the item's own rules behind the Rules information button", () => {
    renderCard({ ...itemWithoutNotes, rules: "Opens most locks." });
    expect(
      screen.getByRole("button", { name: "Show information about Combi-tool Rules" })
    ).toBeInTheDocument();
  });

  it("shows a plain Craftsmanship line for a cybernetic item", () => {
    renderCard({
      id: "a3",
      name: "Sensorium Eye",
      type: "Cybernetic",
      craftsmanship: "Good",
    });
    expect(screen.getByText("Craftsmanship").parentElement).toHaveTextContent("CraftsmanshipGood");
    expect(screen.queryByText("Quality")).not.toBeInTheDocument();
  });
});

describe("ItemCard remove", () => {
  it("confirms removal from the closed header of an expandable card", async () => {
    const user = userEvent.setup();
    const { onRemove } = renderCard(itemWithNotes);
    const removeBtn = screen.getByRole("button", { name: "Remove Digi-weapon" });
    const header = screen.getByRole("button", { name: "Expand Digi-weapon details" });
    expect(header).not.toContainElement(removeBtn);
    await user.click(removeBtn);
    expect(onRemove).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("confirms removal from a flat row", async () => {
    const user = userEvent.setup();
    const { onRemove } = renderCard(itemWithoutNotes);
    await user.click(screen.getByRole("button", { name: "Remove Combi-tool" }));
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("does not render a remove button when not editable", () => {
    renderCard(itemWithNotes, false);
    expect(screen.queryByRole("button", { name: "Remove Digi-weapon" })).not.toBeInTheDocument();
  });
});
