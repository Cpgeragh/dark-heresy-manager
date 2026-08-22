import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
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
  render(
    <ExperienceTab
      character={makeCharacter()}
      isDM
      onUpdate={onUpdate}
      {...props}
    />
  );
  return { onUpdate };
}

describe("ExperienceTab named Career Rank ledger", () => {
  it("shows the Total, Spent, and Remaining XP summary", () => {
    renderTab();
    expect(screen.getByRole("spinbutton", { name: "Total XP" })).toHaveValue(1_000);
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

  it("temporarily preserves the DM Total XP editor until Add XP replaces it", () => {
    const { onUpdate } = renderTab();
    const input = screen.getByRole("spinbutton", { name: "Total XP" });
    fireEvent.change(input, { target: { value: "1200" } });
    expect(onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ total: 1_200, spent: 550 })
    );
  });

  it("shows the summary and cards read-only to a player", () => {
    renderTab({ isDM: false });
    expect(screen.getByText("Read-only")).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton", { name: "Total XP" })).not.toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Scout Rank Card" })).toBeInTheDocument();
  });

  it("shows a clear empty state before Career setup", () => {
    const data = createEmptyCharacterData({ campaignId: "campaign", recoveryCode: "recovery" });
    renderTab({ character: { ...data, id: "character" } });
    expect(screen.getByText("Select a Career and Rank to begin the Rank ledger.")).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });
});
