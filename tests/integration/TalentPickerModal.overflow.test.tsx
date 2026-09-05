import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { useState } from "react";
import { TalentPickerModal, type AnyListItem } from "../../src/mechanics/talents/TalentPickerModal";
import { TALENT_LIST } from "../../src/data/reference/talentData";
import type { TalentEntry } from "../../src/types/Character";

// Real Guardsman Conscript data (careerAdvancesReference.ts): Sound Constitution,
// cost 100, repeatableAtThisRank: 3. Mechadendrite Use is Tech-Priest-flavoured
// and never appears on Guardsman's table at all, a genuine off-career example.
const soundConstitution = TALENT_LIST.find((t) => t.id === "sound-constitution")!;
const mechadendriteUse = TALENT_LIST.find((t) => t.id === "mechadendrite-use")!;
const mechadendriteOptions =
  mechadendriteUse.behaviour?.kind === "fixed-repeatable" ? mechadendriteUse.behaviour.options : [];
// Ordinary, non-repeatable, no career association at all, real precedent for
// "already owned once, should never reappear even on the overflow screen".
const chemGeld = TALENT_LIST.find((t) => t.id === "chem-geld")!;
// Real managed-elsewhere Weapon Training talent, excluded from this picker entirely.
const basicWeaponTraining = TALENT_LIST.find((t) => t.id === "basic-weapon-training")!;
const listData: AnyListItem[] = [
  soundConstitution,
  mechadendriteUse,
  chemGeld,
  basicWeaponTraining,
];

function renderPicker(overrides: Partial<React.ComponentProps<typeof TalentPickerModal>> = {}) {
  const onAdd = vi.fn();
  const onClose = vi.fn();
  render(
    <TalentPickerModal
      title="Add Talent"
      listData={listData}
      entries={[]}
      useTalentBehaviours
      editable
      isDM
      onAdd={onAdd}
      onClose={onClose}
      career="Guardsman"
      rank="Conscript"
      {...overrides}
    />
  );
  return { onAdd, onClose };
}

function StatefulOverflowPicker() {
  const [entries, setEntries] = useState<TalentEntry[]>([]);
  return (
    <TalentPickerModal
      title="Add Talent"
      listData={listData}
      entries={entries}
      useTalentBehaviours
      editable
      isDM
      onAdd={(entry) => setEntries((current) => [...current, entry])}
      onClose={() => undefined}
      career="Guardsman"
      rank="Conscript"
    />
  );
}

function ExhaustibleChoiceOverflowPicker() {
  const [entries, setEntries] = useState<TalentEntry[]>(() =>
    mechadendriteOptions.slice(0, -1).map((specialisation, index) => ({
      uid: `owned-${index}`,
      talentId: mechadendriteUse.id,
      name: `${mechadendriteUse.name} (${specialisation})`,
      specialisation,
    }))
  );
  return (
    <TalentPickerModal
      title="Add Talent"
      listData={[mechadendriteUse]}
      entries={entries}
      useTalentBehaviours
      editable
      isDM
      onAdd={(entry) => setEntries((current) => [...current, entry])}
      onClose={() => undefined}
      career="Guardsman"
      rank="Conscript"
    />
  );
}

describe("TalentPickerModal, career-aware overflow screen", () => {
  it("shows only real, currently-costed talents on the ranks screen by default", () => {
    renderPicker();
    expect(screen.getByText("Sound Constitution")).toBeInTheDocument();
    expect(screen.queryByText("Mechadendrite Use")).not.toBeInTheDocument();
  });

  it("adds a real-cost talent directly with no manual-cost prompt", async () => {
    const user = userEvent.setup();
    const { onAdd } = renderPicker();
    await user.click(screen.getByText("Sound Constitution"));
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        talentId: "sound-constitution",
        xpPurchase: { cost: 100, careerId: "guardsman", sourceRankId: "conscript" },
      })
    );
    expect(screen.queryByText("XP Cost")).not.toBeInTheDocument();
  });

  it("reveals everything, including off-career talents, on the overflow screen", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(screen.getByRole("button", { name: "Show all" }));
    expect(screen.getByText("Sound Constitution")).toBeInTheDocument();
    expect(screen.getByText("Mechadendrite Use")).toBeInTheDocument();
  });

  it("keeps Show all informational but blocks manual-cost purchases for a non-DM", async () => {
    const user = userEvent.setup();
    const { onAdd } = renderPicker({ isDM: false });
    await user.click(screen.getByRole("button", { name: "Show all" }));
    expect(screen.getByText("Mechadendrite Use")).toBeInTheDocument();
    await user.click(screen.getByText("Mechadendrite Use"));
    expect(screen.queryByText("XP Cost")).not.toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("always opens manual-cost for a plain talent clicked on the overflow screen", async () => {
    const user = userEvent.setup();
    const { onAdd } = renderPicker();
    await user.click(screen.getByRole("button", { name: "Show all" }));
    await user.click(screen.getByText("Sound Constitution"));
    expect(screen.getByText("XP Cost")).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("allows 0 as a valid manual cost, only blocks a blank field", async () => {
    const user = userEvent.setup();
    const { onAdd } = renderPicker();
    await user.click(screen.getByRole("button", { name: "Show all" }));
    await user.click(screen.getByText("Sound Constitution"));
    const confirm = screen.getByRole("button", { name: "Buy Sound Constitution" });
    expect(confirm).toBeDisabled();
    await user.type(screen.getByPlaceholderText("0"), "0");
    expect(confirm).toBeEnabled();
    await user.click(confirm);
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        talentId: "sound-constitution",
        manualCost: 0,
        xpPurchase: { cost: 0, careerId: "guardsman", purchasedAtRankId: "conscript" },
      })
    );
  });

  it("still opens the choice screen first for a grouped talent on the overflow screen, then manual-cost after choosing", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(screen.getByRole("button", { name: "Show all" }));
    await user.click(screen.getByText("Mechadendrite Use"));
    const dialog = screen.getByRole("dialog", { name: "Type" });
    await user.click(within(dialog).getByText("Optical"));
    expect(screen.getByText("XP Cost")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Buy Mechadendrite Use" })).toBeInTheDocument();
  });

  it("returns a completed manual-cost choice to the same refreshed choice screen", async () => {
    const user = userEvent.setup();
    render(<StatefulOverflowPicker />);
    await user.click(screen.getByRole("button", { name: "Show all" }));
    await user.click(screen.getByText("Mechadendrite Use"));
    await user.click(within(screen.getByRole("dialog", { name: "Type" })).getByText("Optical"));
    await user.type(screen.getByPlaceholderText("0"), "100");
    await user.click(screen.getByRole("button", { name: "Buy Mechadendrite Use" }));

    const dialog = await screen.findByRole("dialog", { name: "Type" });
    expect(within(dialog).queryByText("Optical")).not.toBeInTheDocument();
    expect(within(dialog).getByText("Manipulator")).toBeInTheDocument();
  });

  it("returns to the overflow list after the final available choice is bought", async () => {
    const user = userEvent.setup();
    const finalChoice = mechadendriteOptions.at(-1)!;
    render(<ExhaustibleChoiceOverflowPicker />);
    await user.click(screen.getByRole("button", { name: "Show all" }));
    await user.click(screen.getByText("Mechadendrite Use"));
    await user.click(within(screen.getByRole("dialog", { name: "Type" })).getByText(finalChoice));
    await user.type(screen.getByPlaceholderText("0"), "100");
    await user.click(screen.getByRole("button", { name: "Buy Mechadendrite Use" }));

    expect(await screen.findByRole("dialog", { name: "Add Talent" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Type" })).not.toBeInTheDocument();
  });

  it("removes an already-owned one-time talent from the overflow screen entirely", async () => {
    const user = userEvent.setup();
    const owned: TalentEntry[] = [{ uid: "1", talentId: "chem-geld", name: "Chem Geld" }];
    renderPicker({ entries: owned });
    await user.click(screen.getByRole("button", { name: "Show all" }));
    expect(screen.queryByText("Chem Geld")).not.toBeInTheDocument();
  });

  it("still excludes a managed-elsewhere Weapon Training talent on the overflow screen", async () => {
    const user = userEvent.setup();
    renderPicker();
    expect(screen.queryByText("Basic Weapon Training")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show all" }));
    expect(screen.queryByText("Basic Weapon Training")).not.toBeInTheDocument();
  });

  it("returns to the overflow screen, not the ranks screen, after backing out of a manual-cost entry", async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(screen.getByRole("button", { name: "Show all" }));
    await user.click(screen.getByText("Sound Constitution"));
    expect(screen.getByText("XP Cost")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back" }));
    const dialog = screen.getByRole("dialog", { name: "Add Talent" });
    expect(within(dialog).getByRole("button", { name: "Back" })).toBeInTheDocument();
    expect(within(dialog).getByText("Mechadendrite Use")).toBeInTheDocument();
  });

  it("moves custom items onto the overflow screen only, not the ranks screen", async () => {
    const user = userEvent.setup();
    const onSelectCustomItem = vi.fn();
    const customItems = [
      {
        id: "custom-1",
        status: "draft" as const,
        name: "Homebrew Talent",
        creator: { userId: "u1" },
        data: {},
      },
    ];
    renderPicker({ customItems: customItems as never, onSelectCustomItem });
    expect(screen.queryByText("Homebrew Talent")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show all" }));
    expect(screen.getByText("Homebrew Talent")).toBeInTheDocument();
  });
});
