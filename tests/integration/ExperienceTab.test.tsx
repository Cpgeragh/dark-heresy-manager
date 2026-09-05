import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ExperienceTab } from "../../src/pages/CharacterSheet/ExperienceTab";
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

function renderTab(props: Partial<React.ComponentProps<typeof ExperienceTab>> = {}) {
  const onUpdate = vi.fn();
  const onUpdateHeader = vi.fn();
  render(
    <ExperienceTab
      character={makeCharacter()}
      isDM
      editable
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
    expect(screen.getByText("Total XP").closest("section")).toHaveClass(
      "grid-cols-3",
      "gap-2",
      "sm:gap-4"
    );
    expect(screen.getByText("Remaining XP")).toHaveClass(
      "w-full",
      "text-center",
      "whitespace-nowrap",
      "text-[10px]"
    );
    expect(screen.getByText("450")).toHaveClass("w-full", "text-center");
    expect(screen.getByText("1000")).toBeInTheDocument();
    expect(screen.getByText("550")).toBeInTheDocument();
    expect(screen.getByText("450")).toBeInTheDocument();
  });

  it("renders every reached named rank and marks the current card", () => {
    renderTab();
    for (const rank of ["Conscript", "Guard", "Armsman", "Sergeant", "Veteran", "Scout"]) {
      expect(screen.getByRole("article", { name: `${rank} Rank Card` })).toBeInTheDocument();
    }
    expect(
      within(screen.getByRole("article", { name: "Scout Rank Card" })).getByText("Current")
    ).toHaveClass("border-emerald-500/50", "text-emerald-300");
    expect(
      within(screen.getByRole("article", { name: "Conscript Rank Card" })).getByText("0–499 XP")
    ).toHaveClass("border-amber-700/50", "text-amber-400/80");
    expect(
      within(screen.getByRole("article", { name: "Conscript Rank Card" })).getByText("Rank 1")
    ).toHaveClass("border-fuchsia-500/50", "text-fuchsia-300");
    expect(
      screen.getAllByRole("article").map((article) => article.getAttribute("aria-label"))
    ).toEqual([
      "Scout Rank Card",
      "Veteran Rank Card",
      "Sergeant Rank Card",
      "Armsman Rank Card",
      "Guard Rank Card",
      "Conscript Rank Card",
    ]);
    expect(screen.getByRole("button", { name: "Collapse Scout Rank Card" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.getByRole("button", { name: "Expand Veteran Rank Card" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("resets expansion to the new current rank when the character ranks up", () => {
    const onUpdate = vi.fn();
    const onUpdateHeader = vi.fn();
    const scoutCharacter = makeCharacter();
    const veteranCharacter = makeCharacter({
      header: { ...scoutCharacter.header, rank: "Veteran", careerPath: undefined },
    });
    const { rerender } = render(
      <ExperienceTab
        character={veteranCharacter}
        isDM
        editable
        onUpdate={onUpdate}
        onUpdateHeader={onUpdateHeader}
      />
    );

    rerender(
      <ExperienceTab
        character={scoutCharacter}
        isDM
        editable
        onUpdate={onUpdate}
        onUpdateHeader={onUpdateHeader}
      />
    );

    expect(screen.getByRole("button", { name: "Collapse Scout Rank Card" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.getByRole("button", { name: "Expand Veteran Rank Card" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("shows career purchases when a previous Rank Card is expanded", async () => {
    const user = userEvent.setup();
    renderTab();
    const conscript = within(screen.getByRole("article", { name: "Conscript Rank Card" }));
    expect(conscript.queryByText("Awareness — Trained")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Expand Conscript Rank Card" }));
    expect(conscript.getAllByText("Career Purchases from This Rank").length).toBeGreaterThan(0);
    const careerPanel = within(conscript.getByRole("tabpanel", { name: "Career Purchases" }));
    expect(careerPanel.getByText("Skills")).toHaveClass("text-sky-300");
    expect(careerPanel.getByText("Talents")).toHaveClass("text-sky-300");
    expect(careerPanel.getByText("Weapon Training")).toHaveClass("text-sky-300");
    expect(careerPanel.queryByText("Awareness — Trained")).not.toBeInTheDocument();
    await user.click(careerPanel.getByRole("button", { name: "Expand Skills purchases" }));
    await user.click(careerPanel.getByRole("button", { name: "Expand Talents purchases" }));
    await user.click(careerPanel.getByRole("button", { name: "Expand Weapon Training purchases" }));
    expect(careerPanel.getByText("Awareness — Trained")).toBeInTheDocument();
    expect(careerPanel.getByText("Basic Weapon Training (Las)")).toBeInTheDocument();
    expect(careerPanel.getByText("Sound Constitution")).toBeInTheDocument();
    expect(
      careerPanel.queryByRole("button", { name: /Characteristics purchases/ })
    ).not.toBeInTheDocument();
    expect(careerPanel.getByText("300 XP")).toBeInTheDocument();
  });

  it("switches between the mobile Rank purchase panels without equal-height side cards", async () => {
    const user = userEvent.setup();
    renderTab();
    const scout = within(screen.getByRole("article", { name: "Scout Rank Card" }));
    const mobileTabs = within(
      scout.getByRole("tablist", { name: "Scout Rank purchase categories" })
    );
    expect(mobileTabs.getByRole("tab", { name: "Career Purchases" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await user.click(mobileTabs.getByRole("tab", { name: "Additional XP" }));
    expect(mobileTabs.getByRole("tab", { name: "Additional XP" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    const additionalPanel = within(scout.getByRole("tabpanel", { name: "Additional XP" }));
    expect(additionalPanel.getByText("Additional XP Spent").closest("section")).toHaveClass(
      "min-h-[45vh]",
      "lg:min-h-0"
    );
    expect(additionalPanel.getByText("Weapon Skill — Simple Advance")).toBeInTheDocument();
    expect(additionalPanel.getByText("Off-career Trait")).toBeInTheDocument();
    expect(scout.getAllByText("Additional XP Spent").length).toBeGreaterThan(0);
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

  it("lets the DM remove accidentally awarded XP from Total", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab();
    await user.click(screen.getByRole("button", { name: "Remove XP" }));
    const dialog = within(screen.getByRole("dialog", { name: "Remove XP" }));
    await user.type(dialog.getByRole("textbox", { name: "Remove XP amount" }), "100");
    await user.type(dialog.getByRole("textbox", { name: "Remove XP reason" }), "Accidental award");
    await user.click(dialog.getByRole("button", { name: "Confirm Remove XP" }));
    expect(onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        total: 900,
        spent: 550,
        transactions: [
          expect.objectContaining({
            type: "remove",
            amount: 100,
            reason: "Accidental award",
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
    expect(screen.getByText("7450 more Spent XP is required.")).not.toHaveClass("text-amber-300");
  });

  it("highlights the available Rank Up message in global yellow", () => {
    const current = makeCharacter();
    renderTab({
      character: {
        ...current,
        header: { ...current.header, rank: "Guard", careerPath: undefined },
        experience: { total: 1_500, spent: 1_000, ranks: [] },
      },
    });
    expect(
      screen.getByText(
        "The required Spent XP has been reached. The DM can now confirm one Rank Up."
      )
    ).toHaveClass("text-amber-300");
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
    expect(dialog.getByText("Current Rank")).toHaveClass("text-sky-300/85");
    expect(dialog.getByText("Choose the next Career path")).toHaveClass("text-sky-300/85");
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

  it("offers only the Rank Up XP Spend action in the final rank-up review", async () => {
    const user = userEvent.setup();
    const current = makeCharacter();
    const { onUpdate } = renderTab({
      character: {
        ...current,
        header: { ...current.header, rank: "Guard", careerPath: undefined },
        experience: { total: 1_500, spent: 1_000, ranks: [] },
      },
    });
    await user.click(screen.getByRole("button", { name: "Rank Up" }));
    const dialog = within(screen.getByRole("dialog", { name: "Confirm Rank Up" }));
    expect(dialog.queryByText("Total")).not.toBeInTheDocument();
    expect(dialog.queryByText("Spent")).not.toBeInTheDocument();
    expect(dialog.queryByText("Remaining")).not.toBeInTheDocument();
    expect(dialog.getByText("The DM may apply an XP cost to ranking up.")).toBeInTheDocument();
    expect(dialog.queryByRole("button", { name: "Add XP" })).not.toBeInTheDocument();
    const spendButton = dialog.getByRole("button", { name: "Spend XP" });
    expect(spendButton).toHaveClass("w-full", "border-amber-500", "text-amber-400");

    await user.click(spendButton);
    const spendDialog = within(screen.getByRole("dialog", { name: "Spend XP" }));
    const spendAmount = spendDialog.getByRole("textbox", { name: "Spend XP amount" });
    const spendReason = spendDialog.getByRole("textbox", { name: "Spend XP reason" });
    expect(
      spendDialog.queryByText(
        "Apply an XP cost to this Rank Up. It will appear under Additional XP Spent on the current Rank card."
      )
    ).not.toBeInTheDocument();
    await user.click(
      spendDialog.getByRole("button", { name: "Show information about Rank Up XP Cost" })
    );
    const costInfo = within(screen.getByRole("dialog", { name: "Rank Up XP Cost" }));
    expect(
      costInfo.getByText(
        "Apply an XP cost to this Rank Up. It will appear under Additional XP Spent on the current Rank card."
      )
    ).toBeInTheDocument();
    await user.click(costInfo.getByRole("button", { name: "Close" }));
    expect(spendAmount).toBeRequired();
    expect(spendReason).toBeRequired();
    expect(spendDialog.getByText("Amount").closest("label")).toHaveClass("text-sky-300/85");
    expect(spendDialog.getByText("Reason").closest("label")).toHaveClass("text-sky-300/85");
    expect(spendDialog.getByText("Required").closest("p")).toHaveClass("text-red-500");
    await user.type(spendAmount, "100");
    expect(spendDialog.getByRole("button", { name: "Confirm Spend" })).toBeDisabled();
    await user.type(spendReason, "Rank ceremony");
    expect(spendDialog.getByText("Spend XP").closest("h2")).toHaveClass("text-red-500");
    expect(spendDialog.getByRole("button", { name: "Confirm Spend" })).toHaveClass(
      "border-red-500",
      "text-red-500"
    );
    await user.click(spendDialog.getByRole("button", { name: "Confirm Spend" }));

    expect(onUpdate).not.toHaveBeenCalled();
    expect(dialog.getByText("Applied Rank Up XP Cost")).toBeInTheDocument();
    expect(dialog.getByText("100 XP")).toHaveClass("text-slate-100");
    expect(dialog.getByText("Rank ceremony")).toBeInTheDocument();
    expect(dialog.queryByText("Final XP adjustments")).not.toBeInTheDocument();
    expect(
      dialog.queryByText("The DM may apply an XP cost to ranking up.")
    ).not.toBeInTheDocument();
    expect(dialog.queryByRole("button", { name: "Spend XP" })).not.toBeInTheDocument();
    const changeButton = dialog.getByRole("button", { name: "Change XP Cost" });
    expect(changeButton).not.toHaveClass("w-full");
    expect(changeButton).toHaveClass("sm:shrink-0", "sm:self-auto");
    expect(changeButton).toHaveClass("px-3", "py-1", "text-xs");

    await user.click(changeButton);
    const changeDialog = within(screen.getByRole("dialog", { name: "Change XP Cost" }));
    const amountInput = changeDialog.getByRole("textbox", { name: "Change XP Cost amount" });
    const reasonInput = changeDialog.getByRole("textbox", { name: "Change XP Cost reason" });
    expect(amountInput).toHaveValue("100");
    expect(reasonInput).toHaveValue("Rank ceremony");
    await user.clear(amountInput);
    await user.type(amountInput, "150");
    await user.clear(reasonInput);
    await user.type(reasonInput, "Changed cost");
    expect(changeDialog.getByText("Change XP Cost").closest("h2")).toHaveClass("text-red-500");
    expect(changeDialog.getByRole("button", { name: "Confirm Change" })).toHaveClass(
      "border-red-500",
      "text-red-500"
    );
    await user.click(changeDialog.getByRole("button", { name: "Confirm Change" }));

    expect(dialog.getByText("150 XP")).toBeInTheDocument();
    expect(dialog.getByText("Changed cost")).toBeInTheDocument();
    expect(onUpdate).not.toHaveBeenCalled();
    await user.click(dialog.getByRole("button", { name: "Confirm Rank Up" }));
    expect(onUpdate).toHaveBeenCalledTimes(1);
    const changedExperience = onUpdate.mock.calls.at(-1)?.[0];
    expect(changedExperience.transactions).toHaveLength(1);
    expect(changedExperience.transactions[0]).toEqual(
      expect.objectContaining({ type: "spend", amount: 150, reason: "Changed cost" })
    );
  });

  it("discards the draft path and XP cost when Rank Up is cancelled", async () => {
    const user = userEvent.setup();
    const current = makeCharacter();
    const { onUpdate } = renderTab({
      character: {
        ...current,
        header: { ...current.header, rank: "Veteran", careerPath: undefined },
        experience: { total: 7_000, spent: 6_000, ranks: [] },
      },
    });

    await user.click(screen.getByRole("button", { name: "Rank Up" }));
    let dialog = within(screen.getByRole("dialog", { name: "Confirm Rank Up" }));
    await user.click(dialog.getByRole("button", { name: "Scout" }));
    await user.click(dialog.getByRole("button", { name: "Spend XP" }));
    const spendDialog = within(screen.getByRole("dialog", { name: "Spend XP" }));
    await user.type(spendDialog.getByRole("textbox", { name: "Spend XP amount" }), "100");
    await user.type(spendDialog.getByRole("textbox", { name: "Spend XP reason" }), "Draft cost");
    await user.click(spendDialog.getByRole("button", { name: "Confirm Spend" }));
    expect(dialog.getByText("Draft cost")).toBeInTheDocument();

    await user.click(dialog.getByRole("button", { name: "Cancel" }));
    expect(onUpdate).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Rank Up" }));
    dialog = within(screen.getByRole("dialog", { name: "Confirm Rank Up" }));
    expect(dialog.getByRole("button", { name: "Confirm Rank Up" })).toBeDisabled();
    expect(dialog.getByRole("button", { name: "Scout" })).toHaveAttribute("aria-pressed", "false");
    expect(dialog.getByText("Final XP adjustments")).toBeInTheDocument();
    expect(dialog.queryByText("Applied Rank Up XP Cost")).not.toBeInTheDocument();
    expect(dialog.queryByText("Draft cost")).not.toBeInTheDocument();
  });

  it("clears an XP cost persisted by the older Rank Up flow when cancelled", async () => {
    const user = userEvent.setup();
    const current = makeCharacter();
    const { onUpdate } = renderTab({
      character: {
        ...current,
        header: { ...current.header, rank: "Guard", careerPath: undefined },
        experience: {
          total: 1_500,
          spent: 1_100,
          ranks: [],
          transactions: [
            {
              id: "legacy-draft-cost",
              type: "spend",
              amount: 100,
              reason: "Old saved choice",
              rankId: "guard",
            },
          ],
        },
      },
    });

    await user.click(screen.getByRole("button", { name: "Rank Up" }));
    const dialog = within(screen.getByRole("dialog", { name: "Confirm Rank Up" }));
    expect(dialog.getByText("Old saved choice")).toBeInTheDocument();
    await user.click(dialog.getByRole("button", { name: "Cancel" }));

    expect(onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ spent: 1_000, transactions: undefined })
    );
  });

  it("shows a sole next Rank in the active red style without making it clickable", async () => {
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
    const nextRank = dialog.getByTestId("single-next-rank");
    expect(nextRank).toHaveTextContent("Armsman");
    expect(nextRank).toHaveClass("border-fuchsia-500", "text-fuchsia-300");
    expect(dialog.queryByRole("button", { name: "Armsman" })).not.toBeInTheDocument();
  });

  it("uses the global Rank colour for selected and unselected branches", async () => {
    const user = userEvent.setup();
    const current = makeCharacter();
    renderTab({
      character: {
        ...current,
        header: { ...current.header, rank: "Veteran", careerPath: undefined },
        experience: { total: 7_000, spent: 6_000, ranks: [] },
      },
    });

    await user.click(screen.getByRole("button", { name: "Rank Up" }));
    const dialog = within(screen.getByRole("dialog", { name: "Confirm Rank Up" }));
    const scout = dialog.getByRole("button", { name: "Scout" });
    const lieutenant = dialog.getByRole("button", { name: "Lieutenant" });
    expect(scout).toHaveClass("border-fuchsia-500/50", "text-fuchsia-300/60");
    expect(lieutenant).toHaveClass("border-fuchsia-500/50", "text-fuchsia-300/60");

    await user.click(scout);
    expect(scout).toHaveClass("border-fuchsia-500", "text-fuchsia-300");
    expect(scout).not.toHaveClass("border-fuchsia-500/50", "text-fuchsia-300/60");
  });

  it("uses the semantic action colours on the page and transaction confirmations", async () => {
    const user = userEvent.setup();
    renderTab();
    const add = screen.getByRole("button", { name: "Add XP" });
    const remove = screen.getByRole("button", { name: "Remove XP" });
    const rankUp = screen.getByRole("button", { name: "Rank Up" });
    expect(add).toHaveClass("border-emerald-500", "text-emerald-300");
    expect(remove).toHaveClass("border-amber-500", "text-amber-400");
    expect(rankUp).toHaveClass("border-red-500", "text-red-500");

    await user.click(add);
    const dialog = within(screen.getByRole("dialog", { name: "Add XP" }));
    expect(dialog.getByRole("button", { name: "Cancel" })).toHaveClass(
      "border-slate-500",
      "text-slate-200"
    );
    expect(dialog.getByRole("button", { name: "Confirm Add XP" })).toHaveClass(
      "border-emerald-500",
      "text-emerald-300"
    );
  });

  it("lets an editable player add XP but keeps DM-only XP actions hidden", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab({ isDM: false });
    expect(screen.queryByText("Read-only")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add XP" }));
    const dialog = within(screen.getByRole("dialog", { name: "Add XP" }));
    await user.type(dialog.getByRole("textbox", { name: "Add XP amount" }), "200");
    await user.type(dialog.getByRole("textbox", { name: "Add XP reason" }), "Session award");
    await user.click(dialog.getByRole("button", { name: "Confirm Add XP" }));
    expect(onUpdate).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Remove XP" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Rank Up" })).not.toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Scout Rank Card" })).toBeInTheDocument();
  });

  it("hides every XP mutation from a DM while active editing is disabled", () => {
    renderTab({ editable: false });
    expect(screen.getByText("Read-only")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add XP" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove XP" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Rank Up" })).not.toBeInTheDocument();
  });

  it("shows a clear empty state before Career setup", () => {
    const data = createEmptyCharacterData({ campaignId: "campaign", recoveryCode: "recovery" });
    renderTab({ character: { ...data, id: "character" } });
    expect(
      screen.getByText("Select a Career and Rank to begin the Rank ledger.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });
});
