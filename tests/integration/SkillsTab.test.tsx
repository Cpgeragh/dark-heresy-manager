// tests/integration/SkillsTab.test.tsx
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { useState } from "react";

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

function StatefulSkillsTab({
  initialSkills,
  talents,
}: {
  initialSkills: SkillEntry[];
  talents?: React.ComponentProps<typeof SkillsTab>["talents"];
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
    />
  );
}

describe("SkillsTab", () => {
  it("renders the header and a trained skill", () => {
    renderTab();
    expect(screen.getAllByText("Basic Skills").length).toBeGreaterThan(0);
    // Name also appears in the (closed) InfoModal dialog title, so match either.
    expect(screen.getAllByText("Awareness").length).toBeGreaterThan(0);
  });

  it("explains how untrained Basic and Advanced Skill totals are used", async () => {
    const user = userEvent.setup();
    renderTab({
      skills: [
        skill(),
        skill({ id: "tech-use", name: "Tech-Use", characteristic: "int", advanced: true, level: "untrained" }),
      ],
    });

    await user.click(screen.getAllByRole("button", { name: "Show information about Basic Skills" })[0]);
    expect(screen.getByText(/half the relevant Characteristic, rounded down/)).toBeInTheDocument();
    await user.click(within(screen.getByRole("dialog", { name: "Basic Skills" })).getByRole("button", { name: "Close" }));

    await user.click(screen.getAllByRole("button", { name: "Show information about Advanced Skills" })[0]);
    expect(screen.getByText(/cannot be attempted while Untrained/)).toBeInTheDocument();
    expect(screen.getByText(/displayed Total shows the Characteristic value/)).toBeInTheDocument();
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

  it("keeps the Skill picker open and uses separated source-labelled cards", async () => {
    const user = userEvent.setup();
    const skills = [
      skill({ id: "awareness", name: "Awareness", level: "untrained" }),
      skill({ id: "dodge", name: "Dodge", characteristic: "ag", level: "untrained" }),
    ];
    render(<StatefulSkillsTab initialSkills={skills} />);
    await user.click(screen.getAllByRole("button", { name: "Add basic skill" })[0]);
    const dialog = screen.getByRole("dialog", { name: "Untrained Basic Skills" });
    const list = within(dialog).getByTestId("skill-picker-card-list");
    expect(list).toHaveClass("space-y-3", "p-3");
    const awarenessCard = within(dialog)
      .getByRole("button", { name: "Select Awareness" })
      .closest("div.rounded-lg");
    expect(awarenessCard).toHaveClass("border-slate-500");
    expect(within(awarenessCard!).getAllByText("CR").length).toBeGreaterThan(0);

    await user.click(within(dialog).getByRole("button", { name: "Select Awareness" }));
    const openDialog = screen.getByRole("dialog", { name: "Untrained Basic Skills" });
    expect(openDialog).toBeInTheDocument();
    expect(within(openDialog).queryByRole("button", { name: "Select Awareness" })).not.toBeInTheDocument();
    expect(within(openDialog).getByRole("button", { name: "Select Dodge" })).toBeInTheDocument();
  });

  it("restores the Skill list position after returning from a grouped category", async () => {
    const user = userEvent.setup();
    render(
      <StatefulSkillsTab
        initialSkills={[
          skill({ id: "ciphers-acolyte", name: "Ciphers (Acolyte)", characteristic: "int", level: "untrained", category: "Ciphers", advanced: true }),
          skill({ id: "ciphers-war-cant", name: "Ciphers (War Cant)", characteristic: "int", level: "untrained", category: "Ciphers", advanced: true }),
        ]}
      />
    );
    await user.click(screen.getByRole("button", { name: "Add advanced skill" }));

    const dialog = screen.getByRole("dialog", { name: "Add Skill" });
    const list = dialog.querySelector<HTMLElement>(".overflow-y-auto");
    if (!list) throw new Error("No Skill picker scroll container found");
    list.scrollTop = 145;
    fireEvent.scroll(list);

    await user.click(within(dialog).getByRole("button", { name: /Ciphers/ }));
    await user.click(screen.getByRole("button", { name: "Back" }));

    const restored = screen
      .getByRole("dialog", { name: "Add Skill" })
      .querySelector<HTMLElement>(".overflow-y-auto");
    expect(restored?.scrollTop).toBe(145);
  });

  it("shows 'View Skills' and no add button in read-only mode", () => {
    renderTab({ editable: false });
    expect(screen.getAllByRole("button", { name: "View basic skills" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "View advanced skills" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Add basic skill" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add advanced skill" })).not.toBeInTheDocument();
  });

  it("allows details without selection feedback in the read-only Skill picker", async () => {
    const user = userEvent.setup();
    renderTab({
      editable: false,
      skills: [skill({ id: "tech-use", name: "Tech-Use", characteristic: "int", advanced: true, level: "untrained" })],
    });
    await user.click(screen.getAllByRole("button", { name: "View advanced skills" })[0]);

    const details = screen.getByRole("button", { name: "Expand Tech-Use details" });
    expect(details).not.toHaveClass("active:!bg-slate-700", "active:!border-red-400");
    await user.click(details);
    expect(screen.getByRole("button", { name: "Collapse Tech-Use details" })).toBeInTheDocument();
  });

  it("shows the empty message when there are no trained skills", () => {
    renderTab({ skills: [skill({ level: "untrained" })] });
    expect(screen.getAllByText("No advanced skills trained yet.").length).toBeGreaterThan(0);
  });

  it("upgrades a skill's level through onUpdate, with a manual cost when it's not on any career table", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab();
    // No career/rank configured, so the next tier (+10) has no real cost — the
    // manual-cost upgrade path is what should appear.
    await user.click(screen.getAllByRole("button", { name: "Expand Awareness details" })[0]);
    await user.click(screen.getByRole("button", { name: "Upgrade to +10 (type your own cost)" }));

    const costInput = screen.getByRole("textbox");
    await user.type(costInput, "150");
    await user.click(screen.getByRole("button", { name: "Upgrade" }));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const next = onUpdate.mock.calls[0][0] as SkillEntry[];
    const updated = next.find((s) => s.id === "s1");
    expect(updated?.level).toBe("+10");
    expect(updated?.manualCosts?.["+10"]).toBe(150);
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
    await user.click(screen.getAllByRole("button", { name: "Expand Awareness details" })[0]);
    await user.click(screen.getByRole("button", { name: "Upgrade to +10 (100 XP)" }));
    await user.click(screen.getByRole("button", { name: "Upgrade" }));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const next = onUpdate.mock.calls[0][0] as SkillEntry[];
    const updated = next.find((s) => s.id === "awareness");
    expect(updated?.level).toBe("+10");
    expect(updated?.manualCosts).toBeUndefined();
  });

  it("shows no upgrade option at all when the next tier exists for the career but hasn't been reached yet", async () => {
    const user = userEvent.setup();
    // Awareness +10 only appears at Scout; at Conscript it's real but locked, not
    // a manual-cost case.
    renderTab({
      career: "Guardsman",
      rank: "Conscript",
      skills: [skill({ id: "awareness" })],
    });
    await user.click(screen.getAllByRole("button", { name: "Expand Awareness details" })[0]);
    expect(screen.queryByRole("button", { name: /Upgrade/ })).not.toBeInTheDocument();
  });

  it("shows Talent skill adjustments and keeps granted training read-only", async () => {
    const user = userEvent.setup();
    renderTab({
      skills: [
        skill({ id: "awareness", name: "Awareness", level: "trained" }),
        skill({ id: "tech-use", name: "Tech-Use", characteristic: "int", level: "untrained", advanced: true }),
      ],
      talents: {
        homeworld: "",
        talents: [
          { uid: "tal", talentId: "talented", name: "Talented (Awareness)", specialisation: "Awareness" },
          { uid: "cult", talentId: "cult-briefing", name: "Cult Briefing (Heretek)", specialisation: "Heretek" },
        ],
        traits: [],
      },
    });
    expect(screen.getAllByText("40").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Tech-Use").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Talent effect: Cult Briefing (Heretek): Trained").length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Talent effect: Talented (Awareness): +10").length
    ).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Delete Tech-Use" })).not.toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Show information about Awareness Talent Adjustments" })[0]);
    expect(screen.getByText("Talented (Awareness): +10")).toBeInTheDocument();
  });

  it("hides redundant Cult Briefing training until it actually supplies the Skill", async () => {
    const user = userEvent.setup();
    const talents = {
      homeworld: "",
      talents: [
        { uid: "cult", talentId: "cult-briefing", name: "Cult Briefing (Heretek)", specialisation: "Heretek" },
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

    expect(screen.queryByText(/Talent effect: Cult Briefing \(Heretek\): Trained/)).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Delete Tech-Use" }).length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole("button", { name: "Delete Tech-Use" })[0]);
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(
      screen.getAllByText("Talent effect: Cult Briefing (Heretek): Trained").length
    ).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Delete Tech-Use" })).not.toBeInTheDocument();
  });
});
