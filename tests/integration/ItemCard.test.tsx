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
  type: "Gear",
  description: "A tiny concealed blade fitted to a ring.",
  itemNotes: "Found on the hive ship.",
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

describe("ItemCard", () => {
  it.each([
    ["with notes", itemWithNotes, "Digi-weapon"],
    ["without notes", itemWithoutNotes, "Combi-tool"],
  ])("starts closed with an expand button %s", (_label, item, name) => {
    renderCard(item);
    expect(screen.getByRole("button", { name: `Expand ${name} details` })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    expect(screen.queryByText("Rules")).not.toBeInTheDocument();
  });

  it("shows the Rules line and a Notes line with an information icon once opened", async () => {
    const user = userEvent.setup();
    renderCard(itemWithNotes);
    await user.click(screen.getByRole("button", { name: "Expand Digi-weapon details" }));
    expect(screen.getByText("Rules").parentElement).toHaveTextContent("Rules-");
    await user.click(
      screen.getByRole("button", { name: "Show information about Digi-weapon Notes" })
    );
    expect(screen.getByRole("dialog", { name: "Digi-weapon Notes" })).toHaveTextContent(
      "Found on the hive ship."
    );
  });

  it("shows a dash on the Notes line of a read-only sheet when the item has no note", async () => {
    const user = userEvent.setup();
    renderCard(itemWithoutNotes, false);
    await user.click(screen.getByRole("button", { name: "Expand Combi-tool details" }));
    expect(screen.getByText("Notes").parentElement).toHaveTextContent("Notes-");
  });

  it("collapses again on a second click", async () => {
    const user = userEvent.setup();
    renderCard(itemWithNotes);
    await user.click(screen.getByRole("button", { name: "Expand Digi-weapon details" }));
    await user.click(screen.getByRole("button", { name: "Collapse Digi-weapon details" }));
    expect(screen.queryByText("Rules")).not.toBeInTheDocument();
  });

  it("shows the description behind an information button beside the name", () => {
    renderCard(itemWithNotes);
    expect(
      screen.getByRole("button", { name: "Show information about Digi-weapon" })
    ).toBeInTheDocument();
    expect(screen.queryByText("A tiny concealed blade fitted to a ring.")).not.toBeInTheDocument();
  });

  it("shows the item's own rules behind the Rules information button", async () => {
    const user = userEvent.setup();
    renderCard({ ...itemWithoutNotes, rules: "Opens most locks." });
    await user.click(screen.getByRole("button", { name: "Expand Combi-tool details" }));
    expect(
      screen.getByRole("button", { name: "Show information about Combi-tool Rules" })
    ).toBeInTheDocument();
  });

  it("shows a plain Craftsmanship line for a cybernetic item", async () => {
    const user = userEvent.setup();
    renderCard({
      id: "a3",
      name: "Sensorium Eye",
      type: "Cybernetic",
      craftsmanship: "Good",
    });
    await user.click(screen.getByRole("button", { name: "Expand Sensorium Eye details" }));
    expect(screen.getByText("Craftsmanship").parentElement).toHaveTextContent("CraftsmanshipGood");
    expect(screen.queryByText("Quality")).not.toBeInTheDocument();
  });
});

describe("ItemCard remove", () => {
  it("confirms removal from the closed header", async () => {
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

  it("does not render a remove button when not editable", () => {
    renderCard(itemWithNotes, false);
    expect(screen.queryByRole("button", { name: "Remove Digi-weapon" })).not.toBeInTheDocument();
  });

  it("names the Remove pop-up after an Archeotech Item", async () => {
    const user = userEvent.setup();
    renderCard({ id: "a9", name: "Combi-tool", type: "Device" });

    await user.click(screen.getByRole("button", { name: "Remove Combi-tool" }));

    expect(screen.getByRole("dialog", { name: "Remove Archeotech Item" })).toBeInTheDocument();
  });
});
