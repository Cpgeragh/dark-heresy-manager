// tests/integration/SkillsTab.test.tsx
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { useState } from "react";

import { SkillsTab } from "../../src/pages/CharacterSheet/SkillsTab";
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

function StatefulSkillsTab({
  initialSkills,
  talents,
  career,
  rank,
}: {
  initialSkills: SkillEntry[];
  talents?: React.ComponentProps<typeof SkillsTab>["talents"];
  career?: React.ComponentProps<typeof SkillsTab>["career"];
  rank?: React.ComponentProps<typeof SkillsTab>["rank"];
}) {
  const [skills, setSkills] = useState(initialSkills);
  return (
    <SkillsTab
      skills={skills}
      editable
      onUpdate={setSkills}
      getCharField={getCharField}
      corruption={{ points: 0, malignancies: [] }}
      talents={talents}
      career={career}
      rank={rank}
    />
  );
}

const HAGIOGRAPHY = {
  homeworld: "imperial-world",
  talents: [],
  traits: [],
};

const GUARDSMAN_DRIVE_GRANT = {
  homeworld: "",
  talents: [],
  traits: [],
  careerStartingChoices: { skillChoices: { 1: 0 } },
};

const COMMON_LORE = [
  skill({
    id: "common-imperial-creed",
    name: "Common Lore (Imperial Creed)",
    characteristic: "int",
    level: "untrained",
    category: "Common Lore",
    advanced: true,
  }),
  skill({
    id: "common-imperium",
    name: "Common Lore (Imperium)",
    characteristic: "int",
    level: "untrained",
    category: "Common Lore",
    advanced: true,
  }),
  skill({
    id: "common-war",
    name: "Common Lore (War)",
    characteristic: "int",
    level: "untrained",
    category: "Common Lore",
    advanced: true,
  }),
];

describe("SkillsTab", () => {
  it("renders the header and a trained skill", () => {
    renderTab();
    expect(screen.getAllByText("Basic Skills").length).toBeGreaterThan(0);
    // Name also appears in the (closed) InfoModal dialog title, so match either.
    expect(screen.getAllByText("Awareness").length).toBeGreaterThan(0);
    const skillRows = screen
      .getAllByText("Awareness")
      .map((name) => name.closest("div.group"))
      .filter((row): row is HTMLElement => row instanceof HTMLElement);
    expect(skillRows.length).toBeGreaterThan(0);
    for (const row of skillRows) {
      expect(row).not.toHaveClass("hover:bg-slate-700/40");
    }
  });

  it("explains how untrained Basic and Advanced Skill totals are used", async () => {
    const user = userEvent.setup();
    renderTab({
      skills: [
        skill(),
        skill({
          id: "tech-use",
          name: "Tech-Use",
          characteristic: "int",
          advanced: true,
          level: "untrained",
        }),
      ],
    });

    await user.click(
      screen.getAllByRole("button", { name: "Show information about Basic Skills" })[0]
    );
    expect(screen.getByText(/half the relevant Characteristic, rounded down/)).toBeInTheDocument();
    await user.click(
      within(screen.getByRole("dialog", { name: "Basic Skills" })).getByRole("button", {
        name: "Close",
      })
    );

    await user.click(
      screen.getAllByRole("button", { name: "Show information about Advanced Skills" })[0]
    );
    expect(screen.getByText(/cannot be attempted while Untrained/)).toBeInTheDocument();
    expect(screen.getByText(/displayed Total shows the Characteristic value/)).toBeInTheDocument();
  });

  it("shows the computed skill total in a labelled stat chip", () => {
    renderTab();

    const totalLabels = screen.getAllByText("Total");
    expect(totalLabels.length).toBeGreaterThan(0);
    const controlGroups = totalLabels.map((label) => label.parentElement?.parentElement);
    for (const label of totalLabels) {
      expect(label.parentElement).toHaveTextContent("30");
    }
    for (const group of controlGroups) {
      expect(group).toHaveClass("grid", "grid-cols-[minmax(0,1fr)_auto]");
    }
  });

  it("keeps Upgrade on its own right-aligned mobile row and immediately left of Delete on desktop", () => {
    renderTab({ isDM: true });

    const upgrades = screen.getAllByRole("button", { name: "Upgrade to +10" });
    expect(upgrades.length).toBeGreaterThanOrEqual(2);
    let mobileLayouts = 0;
    let desktopLayouts = 0;
    for (const upgrade of upgrades) {
      expect(upgrade).toHaveClass("border-red-500", "text-red-500");
      const controls = upgrade.parentElement;
      let metadataRow: Element | null | undefined;
      if (controls?.classList.contains("justify-end")) {
        mobileLayouts += 1;
        metadataRow = controls.nextElementSibling;
      } else {
        desktopLayouts += 1;
        expect(controls).toHaveClass("flex", "items-center");
        expect(
          within(controls as HTMLElement).getByRole("button", { name: "Delete Awareness" })
        ).toBeInTheDocument();
        const headerRow = controls?.parentElement;
        expect(headerRow).toHaveClass("justify-between");
        metadataRow = headerRow?.nextElementSibling;
      }
      expect(metadataRow).toHaveClass("grid", "grid-cols-[minmax(0,1fr)_auto]");
      expect(within(metadataRow as HTMLElement).getByText("Total")).toBeInTheDocument();
    }
    expect(mobileLayouts).toBeGreaterThan(0);
    expect(desktopLayouts).toBeGreaterThan(0);
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
    const deleteContainers = deleteButtons.map((button) => button.parentElement?.parentElement);
    for (const container of deleteContainers) {
      expect(container).toHaveClass("justify-between");
    }

    await user.click(deleteButtons[0]);
    expect(screen.getByText("Delete Awareness from this character?")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Downgrade to/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.queryByText("Delete Awareness from this character?")).not.toBeInTheDocument();

    await user.click(deleteButtons[0]);
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const next = onUpdate.mock.calls[0][0] as SkillEntry[];
    expect(next.find((entry) => entry.id === "s1")).toBeUndefined();
    expect(screen.queryByRole("dialog", { name: "Delete Skill" })).not.toBeInTheDocument();
  });

  it.each([
    { level: "+10" as const, target: "trained" as const, label: "Trained" },
    { level: "+20" as const, target: "+10" as const, label: "+10" },
  ])(
    "offers Downgrade to $label or full deletion from $level",
    async ({ level, target, label }) => {
      const user = userEvent.setup();
      const { onUpdate } = renderTab({ skills: [skill({ level })] });

      await user.click(screen.getAllByRole("button", { name: "Delete Awareness" })[0]);
      const dialog = screen.getByRole("dialog", { name: "Manage Skill" });
      const downgradeButton = within(dialog).getByRole("button", { name: `Downgrade to ${label}` });
      expect(downgradeButton).toHaveClass("border-amber-500", "text-amber-400");
      expect(downgradeButton).not.toHaveClass("bg-amber-900/40");
      expect(within(dialog).getByRole("button", { name: "Delete Skill" })).toBeInTheDocument();
      expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeInTheDocument();

      await user.click(within(dialog).getByRole("button", { name: `Downgrade to ${label}` }));

      expect(onUpdate).toHaveBeenCalledTimes(1);
      const next = onUpdate.mock.calls[0][0] as SkillEntry[];
      expect(next.find((entry) => entry.id === "s1")?.level).toBe(target);
      expect(screen.queryByRole("dialog", { name: "Manage Skill" })).not.toBeInTheDocument();
    }
  );

  it("shows the add affordance when editable", () => {
    renderTab();
    expect(screen.getAllByRole("button", { name: "Add basic skill" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Add advanced skill" })).toBeInTheDocument();
  });

  it("keeps the Skill picker open and uses separated source-labelled cards", async () => {
    const user = userEvent.setup();
    render(<StatefulSkillsTab initialSkills={[]} />);
    await user.click(screen.getAllByRole("button", { name: "Add basic skill" })[0]);
    const dialog = screen.getByRole("dialog", { name: "Available Untrained Basic Skills" });
    const list = within(dialog).getByTestId("skill-picker-card-list");
    expect(list).toHaveClass("space-y-3", "p-3");
    const selectAwareness = within(dialog).getByRole("button", { name: "Select Awareness" });
    expect(selectAwareness.parentElement).toHaveClass("hover:bg-slate-700/40");
    const awarenessCard = selectAwareness.closest("div.rounded-lg");
    expect(awarenessCard).toHaveClass("border-slate-500");
    expect(within(awarenessCard!).getAllByText("CR").length).toBeGreaterThan(0);

    await user.click(within(dialog).getByRole("button", { name: "Select Awareness" }));
    const openDialog = screen.getByRole("dialog", { name: "Available Untrained Basic Skills" });
    expect(openDialog).toBeInTheDocument();
    expect(
      within(openDialog).queryByRole("button", { name: "Select Awareness" })
    ).not.toBeInTheDocument();
    expect(within(openDialog).getByRole("button", { name: "Select Dodge" })).toBeInTheDocument();
  });

  it("restores the Skill list position after returning from a grouped category", async () => {
    const user = userEvent.setup();
    render(<StatefulSkillsTab initialSkills={[]} />);
    await user.click(screen.getByRole("button", { name: "Add advanced skill" }));

    const dialog = screen.getByRole("dialog", { name: "Available Untrained Advanced Skills" });
    const list = dialog.querySelector<HTMLElement>(".overflow-y-auto");
    if (!list) throw new Error("No Skill picker scroll container found");
    list.scrollTop = 145;
    fireEvent.scroll(list);

    await user.click(within(dialog).getByRole("button", { name: /Ciphers/ }));
    await user.click(screen.getByRole("button", { name: "Back" }));

    const restored = screen
      .getByRole("dialog", { name: "Available Untrained Advanced Skills" })
      .querySelector<HTMLElement>(".overflow-y-auto");
    expect(restored?.scrollTop).toBe(145);
  });

  it("keeps unavailable Hagiography skills in Show All while the default picker shows rank-available skills", async () => {
    const user = userEvent.setup();
    render(
      <StatefulSkillsTab
        initialSkills={[]}
        talents={HAGIOGRAPHY}
        career="Imperial Psyker"
        rank="Sanctionite"
      />
    );

    await user.click(screen.getAllByRole("button", { name: "Add basic skill" })[0]);
    const availableDialog = screen.getByRole("dialog", {
      name: "Available Untrained Basic Skills",
    });
    await user.click(within(availableDialog).getByRole("button", { name: /Common Lore/ }));

    const availableCategory = screen.getByRole("dialog", { name: "Common Lore" });
    expect(
      within(availableCategory).getByRole("button", { name: "Select Common Lore (Imperial Creed)" })
    ).toBeInTheDocument();
    expect(
      within(availableCategory).getByRole("button", { name: "Select Common Lore (Imperium)" })
    ).toBeInTheDocument();
    expect(
      within(availableCategory).getAllByText(
        "Hagiography (Homeworld): counts Common Lore (Imperial Creed) as Basic"
      ).length
    ).toBeGreaterThan(0);
    expect(
      within(availableCategory).queryByRole("button", {
        name: "Show information about Common Lore (Imperial Creed) Adjustments",
      })
    ).not.toBeInTheDocument();
    await user.click(
      within(availableCategory).getAllByRole("button", {
        name: "Show information about Common Lore (Imperial Creed)",
      })[0]
    );
    const imperialCreedInfo = screen.getByRole("dialog", { name: "Common Lore (Imperial Creed)" });
    expect(within(imperialCreedInfo).getByText("Effects")).toBeInTheDocument();
    expect(
      within(imperialCreedInfo).getByText(
        "Hagiography (Homeworld): counts Common Lore (Imperial Creed) as Basic"
      )
    ).toBeInTheDocument();
    await user.click(within(imperialCreedInfo).getByRole("button", { name: "Close" }));
    expect(within(availableCategory).queryByText("War")).not.toBeInTheDocument();

    await user.click(within(availableCategory).getByRole("button", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Show All Untrained Basic Skills" }));
    const allDialog = screen.getByRole("dialog", { name: "All Untrained Basic Skills" });
    await user.click(within(allDialog).getByRole("button", { name: /Common Lore/ }));

    const allCategory = screen.getByRole("dialog", { name: "Common Lore" });
    expect(within(allCategory).getAllByText("Imperial Creed").length).toBeGreaterThan(0);
    expect(within(allCategory).getAllByText("Imperium").length).toBeGreaterThan(0);
    expect(within(allCategory).getAllByText("War").length).toBeGreaterThan(0);
    expect(
      within(allCategory).queryByRole("button", { name: /Select Common Lore/ })
    ).not.toBeInTheDocument();
  });

  it("returns to the available picker after training the final skill in an open category", async () => {
    const user = userEvent.setup();
    render(
      <StatefulSkillsTab
        initialSkills={[]}
        talents={HAGIOGRAPHY}
        career="Imperial Psyker"
        rank="Sanctionite"
      />
    );

    await user.click(screen.getAllByRole("button", { name: "Add basic skill" })[0]);
    await user.click(screen.getByRole("button", { name: /Common Lore/ }));
    await user.click(screen.getByRole("button", { name: "Select Common Lore (Imperial Creed)" }));
    await user.click(screen.getByRole("button", { name: "Select Common Lore (Imperium)" }));

    expect(
      await screen.findByRole("dialog", { name: "Available Untrained Basic Skills" })
    ).toBeInTheDocument();
    expect(screen.queryByText("No matches.")).not.toBeInTheDocument();
  });

  it("shows only trained members of a Hagiography Common Lore group on the Skills page", async () => {
    const user = userEvent.setup();
    render(
      <StatefulSkillsTab
        initialSkills={COMMON_LORE.filter((entry) => entry.id !== "common-war").map((entry) => ({
          ...entry,
          level: "trained" as const,
        }))}
        talents={HAGIOGRAPHY}
      />
    );

    await user.click(screen.getAllByRole("button", { name: /Common Lore/ })[0]);
    expect(screen.getAllByText("Common Lore (Imperial Creed)").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Common Lore (Imperium)").length).toBeGreaterThan(0);
    expect(screen.queryByText("Common Lore (War)")).not.toBeInTheDocument();
  });

  it("shows 'View Skills' and no add button in read-only mode", () => {
    renderTab({ editable: false });
    expect(screen.getAllByRole("button", { name: "View basic skills" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "View advanced skills" }).length).toBeGreaterThan(
      0
    );
    expect(screen.queryByRole("button", { name: "Add basic skill" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add advanced skill" })).not.toBeInTheDocument();
  });

  it("shows the empty message when there are no trained skills", () => {
    renderTab({ skills: [skill({ level: "untrained" })] });
    expect(screen.getAllByText("No advanced skills trained yet.").length).toBeGreaterThan(0);
  });

  it("upgrades a skill's level through onUpdate, with a manual cost when it's not on any career table", async () => {
    const user = userEvent.setup();
    // Manual-cost entry is DM-only, see the player visibility test below for
    // that gating itself.
    const { onUpdate } = renderTab({
      isDM: true,
      career: "Guardsman",
      rank: "Conscript",
      skills: [skill({ id: "off-career-awareness" })],
    });
    await user.click(screen.getAllByRole("button", { name: "Upgrade to +10" })[0]);

    const costInput = screen.getByRole("textbox");
    await user.type(costInput, "150");
    await user.click(screen.getByRole("button", { name: "Upgrade" }));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const next = onUpdate.mock.calls[0][0] as SkillEntry[];
    const updated = next.find((s) => s.id === "off-career-awareness");
    expect(updated?.level).toBe("+10");
    expect(updated?.manualCosts?.["+10"]).toBe(150);
    expect(updated?.xpPurchases?.["+10"]).toEqual({
      cost: 150,
      careerId: "guardsman",
      purchasedAtRankId: "conscript",
    });
  });

  it("accepts 0 as a valid manual upgrade cost, blocking only a blank field", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab({ isDM: true });
    await user.click(screen.getAllByRole("button", { name: "Upgrade to +10" })[0]);

    const confirmButton = screen.getByRole("button", { name: "Upgrade" });
    expect(confirmButton).toBeDisabled();

    await user.type(screen.getByRole("textbox"), "0");
    expect(confirmButton).toBeEnabled();
    await user.click(confirmButton);

    const next = onUpdate.mock.calls[0][0] as SkillEntry[];
    const updated = next.find((s) => s.id === "s1");
    expect(updated?.manualCosts?.["+10"]).toBe(0);
  });

  it("hides the manual-upgrade trigger from a non-DM player", () => {
    renderTab();
    expect(screen.queryByRole("button", { name: "Upgrade to +10" })).not.toBeInTheDocument();
  });

  it("shows the manual-upgrade trigger in the standard red style for a DM", () => {
    renderTab({ isDM: true });
    for (const upgrade of screen.getAllByRole("button", { name: "Upgrade to +10" })) {
      expect(upgrade).toBeEnabled();
      expect(upgrade).toHaveClass("border-red-500", "text-red-500");
    }
  });

  it("upgrades using the real career cost when the next tier is actually unlocked, no manual cost stored", async () => {
    const user = userEvent.setup();
    // Awareness +10 is a real Scout-rank advance, costing 100 XP. Id has to
    // match the real reference data ("awareness"), not the test fixture default.
    const { onUpdate } = renderTab({
      career: "Guardsman",
      rank: "Scout",
      skills: [skill({ id: "awareness" })],
    });
    await user.click(screen.getAllByRole("button", { name: "Upgrade to +10" })[0]);
    await user.click(screen.getByRole("button", { name: "Upgrade" }));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const next = onUpdate.mock.calls[0][0] as SkillEntry[];
    const updated = next.find((s) => s.id === "awareness");
    expect(updated?.level).toBe("+10");
    expect(updated?.manualCosts).toBeUndefined();
    expect(updated?.xpPurchases?.["+10"]).toEqual({
      cost: 100,
      careerId: "guardsman",
      sourceRankId: "scout",
    });
  });

  it("removes refunded tier metadata when a Skill is downgraded", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab({
      skills: [
        skill({
          level: "+20",
          manualCosts: { trained: 50, "+10": 75, "+20": 100 },
          xpPurchases: {
            trained: { cost: 50, purchasedAtRankId: "conscript" },
            "+10": { cost: 75, purchasedAtRankId: "guard" },
            "+20": { cost: 100, purchasedAtRankId: "armsman" },
          },
        }),
      ],
    });

    await user.click(screen.getAllByRole("button", { name: "Delete Awareness" })[0]);
    await user.click(
      within(screen.getByRole("dialog", { name: "Manage Skill" })).getByRole("button", {
        name: "Downgrade to +10",
      })
    );

    const updated = (onUpdate.mock.calls[0][0] as SkillEntry[])[0];
    expect(updated.level).toBe("+10");
    expect(updated.manualCosts).toEqual({ trained: 50, "+10": 75 });
    expect(updated.xpPurchases).toEqual({
      trained: { cost: 50, purchasedAtRankId: "conscript" },
      "+10": { cost: 75, purchasedAtRankId: "guard" },
    });
  });

  it("shows no upgrade option at all when the next tier exists for the career but hasn't been reached yet", async () => {
    // Awareness +10 only appears at Scout; at Conscript it's real but locked, not
    // a manual-cost case.
    renderTab({
      career: "Guardsman",
      rank: "Conscript",
      skills: [skill({ id: "awareness" })],
    });
    expect(screen.queryByRole("button", { name: /Upgrade/ })).not.toBeInTheDocument();
  });

  it("shows Talent skill adjustments and keeps granted training read-only", async () => {
    const user = userEvent.setup();
    renderTab({
      skills: [skill({ id: "awareness", name: "Awareness", level: "trained" })],
      talents: {
        homeworld: "",
        talents: [
          {
            uid: "tal",
            talentId: "talented",
            name: "Talented (Awareness)",
            specialisation: "Awareness",
          },
          {
            uid: "cult",
            talentId: "cult-briefing",
            name: "Cult Briefing (Heretek)",
            specialisation: "Heretek",
          },
        ],
        traits: [],
      },
    });
    expect(screen.getAllByText("40").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Tech-Use").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Cult Briefing (Heretek) (Talent): counts Tech-Use as trained").length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Talented (Awareness) (Talent): +10").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Delete Tech-Use" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Show information about Awareness Adjustments" })
    ).not.toBeInTheDocument();
    await user.click(
      screen.getAllByRole("button", { name: "Show information about Awareness" })[0]
    );
    const awarenessInfo = screen.getByRole("dialog", { name: "Awareness" });
    expect(within(awarenessInfo).getByText("Effects")).toBeInTheDocument();
    expect(
      within(awarenessInfo).getByText("Talented (Awareness) (Talent): +10")
    ).toBeInTheDocument();
  });

  it("derives a Career-granted Skill from the catalogue without saving or duplicating it", () => {
    renderTab({
      skills: [],
      career: "Guardsman",
      rank: "Scout",
      talents: GUARDSMAN_DRIVE_GRANT,
    });

    // The mobile and desktop layouts coexist in the DOM, with one card in each.
    expect(screen.getAllByText("Drive (Ground Vehicle)")).toHaveLength(2);
    expect(
      screen.getAllByText("Career: Guardsman (Career): counts Drive (Ground Vehicle) as trained")
    ).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: "Delete Drive (Ground Vehicle)" })
    ).not.toBeInTheDocument();
  });

  it("derives Trait-granted training from the catalogue without creating owned progress", async () => {
    const user = userEvent.setup();
    renderTab({
      skills: [],
      talents: {
        homeworld: "",
        talents: [],
        traits: [
          {
            uid: "blank-slate",
            talentId: "blank-slate",
            name: "Blank Slate",
            acquisition: { trait: { blankSlateSkillIds: ["common-war"] } },
          },
        ],
      },
    });

    await user.click(screen.getAllByRole("button", { name: /Common Lore/ })[0]);
    expect(screen.getAllByText("Common Lore (War)").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Blank Slate (Trait): counts Common Lore (War) as trained").length
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: "Delete Common Lore (War)" })
    ).not.toBeInTheDocument();
  });

  it("stores only the paid +10 tier when upgrading a free Career-granted Skill", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab({
      skills: [],
      career: "Guardsman",
      rank: "Scout",
      talents: GUARDSMAN_DRIVE_GRANT,
    });

    await user.click(screen.getAllByRole("button", { name: "Upgrade to +10" })[0]);
    await user.click(screen.getByRole("button", { name: "Upgrade" }));

    const next = onUpdate.mock.calls[0][0] as SkillEntry[];
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({
      id: "drive-ground",
      level: "+10",
      xpPurchases: {
        "+10": {
          cost: 100,
          careerId: "guardsman",
          sourceRankId: "guard",
        },
      },
    });
    expect(next[0].xpPurchases?.trained).toBeUndefined();
  });

  it("removes owned progress when downgrading to free granted training", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab({
      skills: [
        skill({
          id: "drive-ground",
          name: "Drive (Ground Vehicle)",
          characteristic: "ag",
          advanced: true,
          level: "+10",
          xpPurchases: {
            "+10": { cost: 100, careerId: "guardsman", sourceRankId: "guard" },
          },
        }),
      ],
      career: "Guardsman",
      rank: "Scout",
      talents: GUARDSMAN_DRIVE_GRANT,
    });

    await user.click(screen.getAllByRole("button", { name: "Delete Drive (Ground Vehicle)" })[0]);
    await user.click(
      within(screen.getByRole("dialog", { name: "Manage Skill" })).getByRole("button", {
        name: "Downgrade to Trained",
      })
    );

    expect(onUpdate).toHaveBeenCalledWith([]);
  });

  it("hides redundant Cult Briefing training until it actually supplies the Skill", async () => {
    const user = userEvent.setup();
    const talents = {
      homeworld: "",
      talents: [
        {
          uid: "cult",
          talentId: "cult-briefing",
          name: "Cult Briefing (Heretek)",
          specialisation: "Heretek",
        },
      ],
      traits: [],
    };
    render(
      <StatefulSkillsTab
        initialSkills={[
          skill({
            id: "tech-use",
            name: "Tech-Use",
            characteristic: "int",
            level: "trained",
            advanced: true,
          }),
        ]}
        talents={talents}
      />
    );

    expect(
      screen.queryByText(/Cult Briefing \(Heretek\) \(Talent\): Trained/)
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Delete Tech-Use" }).length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole("button", { name: "Delete Tech-Use" })[0]);
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(
      screen.getAllByText("Cult Briefing (Heretek) (Talent): counts Tech-Use as trained").length
    ).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Delete Tech-Use" })).not.toBeInTheDocument();
  });
});
