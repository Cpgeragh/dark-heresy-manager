// tests/integration/ItemCard.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ItemCard } from "../../src/pages/characterSheet/ArcheotechTab/ItemCard";
import type { ArcheotechItem } from "../../src/types/Character";

const itemWithBody: ArcheotechItem = {
  id: "a1",
  name: "Digi-weapon",
  type: "Weapon",
  description: "A tiny concealed blade fitted to a ring.",
  weight: "0.1 kg",
  value: "500 Thrones",
  availability: "Rare",
};

const itemWithoutBody: ArcheotechItem = {
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

describe("ItemCard with body content (description/notes)", () => {
  it("renders the title as a real button and starts collapsed", () => {
    renderCard(itemWithBody);
    const header = screen.getByRole("button", { name: /Digi-weapon/ });
    expect(header).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("A tiny concealed blade fitted to a ring.")).not.toBeInTheDocument();
  });

  it("expands to show the description when the header is clicked", async () => {
    const user = userEvent.setup();
    renderCard(itemWithBody);
    await user.click(screen.getByRole("button", { name: /Digi-weapon/ }));
    expect(screen.getByText("A tiny concealed blade fitted to a ring.")).toBeInTheDocument();
  });

  it("collapses again on a second click", async () => {
    const user = userEvent.setup();
    renderCard(itemWithBody);
    const header = screen.getByRole("button", { name: /Digi-weapon/ });
    await user.click(header);
    await user.click(header);
    expect(screen.queryByText("A tiny concealed blade fitted to a ring.")).not.toBeInTheDocument();
  });
});

describe("ItemCard with no body content", () => {
  it("renders the title as plain text, not a button", () => {
    renderCard(itemWithoutBody);
    expect(screen.queryByRole("button", { name: /Combi-tool/ })).not.toBeInTheDocument();
    expect(screen.getByText("Combi-tool")).toBeInTheDocument();
  });
});

describe("ItemCard remove", () => {
  it("calls onRemove when the remove button is clicked, and it's not nested inside the header button", async () => {
    const user = userEvent.setup();
    const { onRemove } = renderCard(itemWithBody);
    const removeBtn = screen.getByRole("button", { name: "Remove" });
    const header = screen.getByRole("button", { name: /Digi-weapon/ });
    expect(header).not.toContainElement(removeBtn);
    await user.click(removeBtn);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("does not render a remove button when not editable", () => {
    renderCard(itemWithBody, false);
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });
});
