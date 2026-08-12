// tests/integration/SkillsTab.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { SkillsTab } from "../../src/pages/characterSheet/SkillsTab";
import type { SkillEntry, Characteristics } from "../../src/types/Character";
import type { CharField } from "../../src/types/Character";

const getCharField = (_k: keyof Characteristics): CharField => ({ base: 30, advances: 0 });

function skill(over: Partial<SkillEntry> = {}): SkillEntry {
  return {
    id: "s1",
    name: "Awareness",
    characteristic: "per",
    level: "trained",
    category: "General",
    advanced: false,
    source: "CR",
    ...over,
  };
}

function renderTab(props: Partial<React.ComponentProps<typeof SkillsTab>> = {}) {
  const onUpdate = vi.fn();
  render(
    <SkillsTab
      skills={[skill()]}
      editable={true}
      onUpdate={onUpdate}
      getCharField={getCharField}
      corruption={{ points: 0, malignancies: [] }}
      {...props}
    />
  );
  return { onUpdate };
}

describe("SkillsTab", () => {
  it("renders the header and a trained skill", () => {
    renderTab();
    expect(screen.getAllByText("Basic Skills").length).toBeGreaterThan(0);
    // Name also appears in the (closed) InfoModal dialog title, so match either.
    expect(screen.getAllByText("Awareness").length).toBeGreaterThan(0);
  });

  it("shows the computed skill total in a labelled stat chip", () => {
    renderTab();

    const totalLabels = screen.getAllByText("Total");
    expect(totalLabels.length).toBeGreaterThan(0);
    for (const label of totalLabels) {
      expect(label.parentElement).toHaveTextContent("30");
      const controlGroup = label.parentElement?.parentElement;
      expect(controlGroup).toHaveClass("gap-4", "shrink-0");
      expect(
        controlGroup?.querySelector('button[aria-label="Delete Awareness"]')
      ).toBeInTheDocument();
    }
  });

  it("places grouped skill chips beneath the category name", () => {
    renderTab({
      skills: [
        skill({
          id: "ciphers-acolyte",
          name: "Ciphers (Acolyte)",
          characteristic: "int",
          category: "Ciphers",
          advanced: true,
        }),
        skill({
          id: "ciphers-war-cant",
          name: "Ciphers (War Cant)",
          characteristic: "int",
          category: "Ciphers",
          advanced: true,
        }),
      ],
    });

    const categoryName = screen.getByText("Ciphers");
    const contentBlock = categoryName.parentElement;

    expect(contentBlock).toHaveClass("space-y-1.5");
    expect(contentBlock?.children[0]).toBe(categoryName);
    expect(contentBlock?.children[1]).toHaveTextContent("Int");
    expect(contentBlock?.children[1]).toHaveTextContent("Advanced");
  });

  it("shows every characteristic used by a mixed-characteristic group", () => {
    renderTab({
      skills: [
        skill({
          id: "trade-agri",
          name: "Trade (Agri)",
          characteristic: "s",
          category: "Trade",
          advanced: true,
        }),
        skill({
          id: "trade-cook",
          name: "Trade (Cook)",
          characteristic: "int",
          category: "Trade",
          advanced: true,
        }),
      ],
    });

    const groupButtons = screen.getAllByRole("button", { name: /Trade/ });
    expect(groupButtons.length).toBeGreaterThan(0);
    for (const groupButton of groupButtons) {
      expect(groupButton).toHaveTextContent("S");
      expect(groupButton).toHaveTextContent("Int");
    }
  });

  it("uses the card-header delete confirmation before removing a skill", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab();

    const deleteButtons = screen.getAllByRole("button", {
      name: "Delete Awareness",
    });

    expect(deleteButtons.length).toBeGreaterThan(0);
    for (const deleteButton of deleteButtons) {
      expect(deleteButton.parentElement?.parentElement).toHaveClass("gap-4");
    }

    await user.click(deleteButtons[0]);
    expect(
      screen.getByText("Delete Awareness from this character?")
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onUpdate).not.toHaveBeenCalled();
    expect(
      screen.queryByText("Delete Awareness from this character?")
    ).not.toBeInTheDocument();

    await user.click(deleteButtons[0]);
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const next = onUpdate.mock.calls[0][0] as SkillEntry[];
    expect(next.find((entry) => entry.id === "s1")?.level).toBe("untrained");
  });

  it("shows the add affordance when editable", () => {
    renderTab();
    expect(screen.getAllByRole("button", { name: "Add basic skill" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Add advanced skill" })).toBeInTheDocument();
  });

  it("shows 'View Skills' and no add button in read-only mode", () => {
    renderTab({ editable: false });
    expect(screen.getAllByRole("button", { name: "View basic skills" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "View advanced skills" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Add basic skill" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add advanced skill" })).not.toBeInTheDocument();
  });

  it("shows the empty message when there are no trained skills", () => {
    renderTab({ skills: [skill({ level: "untrained" })] });
    expect(screen.getAllByText("No advanced skills trained yet.").length).toBeGreaterThan(0);
  });

  it("updates a skill's level through onUpdate", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab();
    // Expand the row, then set its level to +20.
    await user.click(screen.getAllByRole("button", { name: "Expand Awareness details" })[0]);
    await user.click(screen.getByLabelText("Set skill level to +20"));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const next = onUpdate.mock.calls[0][0] as SkillEntry[];
    expect(next.find((s) => s.id === "s1")?.level).toBe("+20");
  });
});
