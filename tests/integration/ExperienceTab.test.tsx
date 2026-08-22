import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ExperienceTab } from "../../src/pages/characterSheet/ExperienceTab";
import { createEmptyCharacterData } from "../../src/utils/characterFactory";
import type { Character } from "../../src/types/Character";

function makeCharacter(overrides: Partial<Character> = {}): Character {
  const data = createEmptyCharacterData({ campaignId: "campaign", recoveryCode: "recovery" });
  const character: Character = {
    ...data,
    id: "character",
    header: {
      ...data.header,
      career: "Guardsman",
      rank: "Scout",
      careerPath: "Scout",
    },
    characteristics: {
      ...data.characteristics,
      ws: {
        base: 30,
        advances: 1,
        advancePurchases: {
          simple: { cost: 100, careerId: "guardsman", purchasedAtRankId: "scout" },
        },
      },
    },
    skills: [
      {
        id: "awareness",
        name: "Awareness",
        characteristic: "per",
        level: "+10",
        category: "General",
        advanced: false,
        source: "CR",
        xpPurchases: {
          trained: { cost: 100, careerId: "guardsman", sourceRankId: "conscript" },
          "+10": { cost: 100, careerId: "guardsman", sourceRankId: "scout" },
        },
      },
    ],
    talentsAndTraits: {
      ...data.talentsAndTraits,
      talents: [
        {
          uid: "sound",
          talentId: "sound-constitution",
          name: "Sound Constitution",
          xpPurchase: { cost: 100, careerId: "guardsman", sourceRankId: "conscript" },
        },
      ],
      traits: [
        {
          uid: "manual",
          talentId: "chem-geld",
          name: "Off-career Trait",
          xpPurchase: { cost: 50, careerId: "guardsman", purchasedAtRankId: "scout" },
        },
      ],
    },
    weaponTraining: {
      trained: ["basic-las"],
      xpPurchases: {
        "basic-las": { cost: 100, careerId: "guardsman", sourceRankId: "conscript" },
      },
      exoticWeapons: [],
    },
    experience: { total: 1_000, spent: 550, ranks: [] },
  };
  return { ...character, ...overrides };
}

function renderTab(
  props: Partial<React.ComponentProps<typeof ExperienceTab>> = {}
) {
  const onUpdate = vi.fn();
  const onUpdateHeader = vi.fn();
  render(
    <ExperienceTab
      character={makeCharacter()}
      isDM
      onUpdate={onUpdate}
      onUpdateHeader={onUpdateHeader}
      {...props}
    />
  );
  return { onUpdate, onUpdateHeader };
}

describe("ExperienceTab named Career Rank ledger", () => {
  it("shows the Total, Spent, and Remaining XP summary", () => {
    renderTab();
    expect(screen.getByText("1000")).toBeInTheDocument();
    expect(screen.getByText("550")).toBeInTheDocument();
    expect(screen.getByText("450")).toBeInTheDocument();
  });

  it("renders every reached named rank and marks the current card", () => {
    renderTab();
    for (const rank of ["Conscript", "Guard", "Armsman", "Sergeant", "Veteran", "Scout"]) {
      expect(screen.getByRole("article", { name: `${rank} Rank Card` })).toBeInTheDocument();
    }
    expect(within(screen.getByRole("article", { name: "Scout Rank Card" })).getByText("Current"))
      .toBeInTheDocument();
  });

  it("shows career purchases on their source Rank Card", () => {
    renderTab();
    const conscript = within(screen.getByRole("article", { name: "Conscript Rank Card" }));
    expect(conscript.getByText("Awareness — Trained")).toBeInTheDocument();
    expect(conscript.getByText("Basic Weapon Training (Las)")).toBeInTheDocument();
    expect(conscript.getByText("Sound Constitution")).toBeInTheDocument();
    expect(conscript.getAllByText("300 XP")).toHaveLength(2);
  });

  it("shows non-rank-specific purchases under Rank Up XP Spent", () => {
    renderTab();
    const scout = within(screen.getByRole("article", { name: "Scout Rank Card" }));
    expect(scout.getByText("Awareness — +10")).toBeInTheDocument();
    expect(scout.getByText("Weapon Skill — Simple Advance")).toBeInTheDocument();
    expect(scout.getByText("Off-career Trait")).toBeInTheDocument();
    expect(scout.getByText("Rank Up XP Spent")).toBeInTheDocument();
  });

  it("has no freeform Purchased Advances editor or generic Rank picker", () => {
    renderTab();
    expect(screen.queryByText("Purchased Advances")).not.toBeInTheDocument();
    expect(screen.queryByText("Add Advance")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g. +10 Weapon Skill")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Rank 1/ })).not.toBeInTheDocument();
  });

  it("lets the DM add XP without changing Spent XP", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab();
    await user.click(screen.getByRole("button", { name: "Add XP" }));
    const dialog = within(screen.getByRole("dialog", { name: "Add XP" }));
    await user.type(dialog.getByRole("textbox", { name: "Add XP amount" }), "200");
    await user.type(dialog.getByRole("textbox", { name: "Add XP reason" }), "Session award");
    await user.click(dialog.getByRole("button", { name: "Confirm Add XP" }));
    expect(onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        total: 1_200,
        spent: 550,
        transactions: [
          expect.objectContaining({
            type: "add",
            amount: 200,
            reason: "Session award",
            rankId: "scout",
          }),
        ],
      })
    );
  });

  it("lets the DM spend available XP against the current Rank Card", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab();
    await user.click(screen.getByRole("button", { name: "Spend XP" }));
    const dialog = within(screen.getByRole("dialog", { name: "Spend XP" }));
    await user.type(dialog.getByRole("textbox", { name: "Spend XP amount" }), "100");
    await user.type(dialog.getByRole("textbox", { name: "Spend XP reason" }), "Elite advance");
    await user.click(dialog.getByRole("button", { name: "Confirm Spend XP" }));
    expect(onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        total: 1_000,
        spent: 650,
        transactions: [
          expect.objectContaining({
            type: "spend",
            amount: 100,
            reason: "Elite advance",
            rankId: "scout",
          }),
        ],
      })
    );
  });

  it("blocks Rank Up until the next Spent XP threshold", () => {
    renderTab();
    expect(screen.getByRole("button", { name: "Rank Up" })).toBeDisabled();
    expect(screen.getByText("7450 more Spent XP is required.")).toBeInTheDocument();
  });

  it("requires a valid branch choice and confirms exactly one Rank Up", async () => {
    const user = userEvent.setup();
    const current = makeCharacter();
    const { onUpdateHeader } = renderTab({
      character: {
        ...current,
        header: { ...current.header, rank: "Veteran", careerPath: undefined },
        experience: { total: 7_000, spent: 6_000, ranks: [] },
      },
    });

    await user.click(screen.getByRole("button", { name: "Rank Up" }));
    const dialog = within(screen.getByRole("dialog", { name: "Confirm Rank Up" }));
    expect(dialog.getByRole("button", { name: "Assault Veteran" })).toBeInTheDocument();
    expect(dialog.getByRole("button", { name: "Lieutenant" })).toBeInTheDocument();
    expect(dialog.getByRole("button", { name: "Scout" })).toBeInTheDocument();
    expect(dialog.getByRole("button", { name: "Confirm Rank Up" })).toBeDisabled();

    await user.click(dialog.getByRole("button", { name: "Scout" }));
    await user.click(dialog.getByRole("button", { name: "Confirm Rank Up" }));
    expect(onUpdateHeader).toHaveBeenLastCalledWith(
      expect.objectContaining({ rank: "Scout", careerPath: "Scout" })
    );
  });

  it("offers Add XP and Spend XP in the final rank-up review", async () => {
    const user = userEvent.setup();
    const current = makeCharacter();
    renderTab({
      character: {
        ...current,
        header: { ...current.header, rank: "Guard", careerPath: undefined },
        experience: { total: 1_500, spent: 1_000, ranks: [] },
      },
    });
    await user.click(screen.getByRole("button", { name: "Rank Up" }));
    const dialog = within(screen.getByRole("dialog", { name: "Confirm Rank Up" }));
    expect(dialog.getByRole("button", { name: "Add XP" })).toBeInTheDocument();
    expect(dialog.getByRole("button", { name: "Spend XP" })).toBeInTheDocument();
  });

  it("shows the summary and cards read-only to a player", () => {
    renderTab({ isDM: false });
    expect(screen.getByText("Read-only")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add XP" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Spend XP" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Rank Up" })).not.toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Scout Rank Card" })).toBeInTheDocument();
  });

  it("shows a clear empty state before Career setup", () => {
    const data = createEmptyCharacterData({ campaignId: "campaign", recoveryCode: "recovery" });
    renderTab({ character: { ...data, id: "character" } });
    expect(screen.getByText("Select a Career and Rank to begin the Rank ledger.")).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });
});
