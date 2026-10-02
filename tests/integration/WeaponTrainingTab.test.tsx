// tests/integration/WeaponTrainingTab.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { WeaponTrainingTab } from "../../src/pages/CharacterSheet/WeaponTrainingTab";
import type { WeaponTrainingBlock } from "../../src/types/Character";

function makeBlock(over: Partial<WeaponTrainingBlock> = {}): WeaponTrainingBlock {
  return { trained: [], exoticWeapons: [], ...over };
}

function renderTab(props: Partial<React.ComponentProps<typeof WeaponTrainingTab>> = {}) {
  const onUpdate = vi.fn();
  render(
    <WeaponTrainingTab
      weaponTraining={makeBlock()}
      editable={true}
      onUpdate={onUpdate}
      {...props}
    />
  );
  return { onUpdate };
}

describe("WeaponTrainingTab", () => {
  it("renders all five training group labels", () => {
    renderTab();
    for (const label of [
      "Basic Weapon Training",
      "Heavy Weapon Training",
      "Melee Weapon Training",
      "Pistol Training",
      "Thrown Weapon Training",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("renders training buttons within a group", () => {
    renderTab();
    expect(screen.getAllByRole("button", { name: /^Bolt/ })[0]).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Chain/ })[0]).toBeInTheDocument();
  });

  it("shows trained buttons as pressed", () => {
    renderTab({ weaponTraining: makeBlock({ trained: ["basic-bolt"] }) });
    expect(screen.getAllByRole("button", { name: /^Bolt/ })[0]).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("shows a confirm dialog and only calls onUpdate after confirming, when an already-trained button is clicked", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab({ weaponTraining: makeBlock({ trained: ["basic-bolt"] }) });

    await user.click(screen.getAllByRole("button", { name: /^Bolt/ })[0]);
    expect(onUpdate).not.toHaveBeenCalled();

    expect(screen.getByText(/Remove Basic Weapon Training \(Bolt\)\?/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const next = onUpdate.mock.calls[0][0] as WeaponTrainingBlock;
    expect(next.trained).not.toContain("basic-bolt");
  });

  it("does not call onUpdate if the remove-training confirm dialog is cancelled", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab({ weaponTraining: makeBlock({ trained: ["basic-bolt"] }) });

    await user.click(screen.getAllByRole("button", { name: /^Bolt/ })[0]);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("disables training buttons and ignores clicks in read-only mode", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab({ editable: false });

    const button = screen.getAllByRole("button", { name: /^Bolt/ })[0];
    expect(button).toBeDisabled();

    await user.click(button);
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("shows a confirm dialog and only calls onUpdate after confirming, for an unlocked real-cost group", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab({ career: "Guardsman", rank: "Conscript" });

    const button = screen.getAllByRole("button", { name: /^Las/ })[0];
    await user.click(button);
    expect(onUpdate).not.toHaveBeenCalled();

    expect(
      screen.getByText(/Train Basic Weapon Training \(Las\) for 100 XP\?/)
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Train" }));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const next = onUpdate.mock.calls[0][0] as WeaponTrainingBlock;
    expect(next.trained).toContain("basic-las");
    expect(next.manualCosts).toBeUndefined();
    expect(next.xpPurchases?.["basic-las"]).toEqual({
      cost: 100,
      careerId: "guardsman",
      sourceRankId: "conscript",
    });
  });

  it("does not call onUpdate if the confirm dialog is cancelled", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab({ career: "Guardsman", rank: "Conscript" });

    await user.click(screen.getAllByRole("button", { name: /^Las/ })[0]);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("disables a Locked pill outright for a non-DM, even when editable", () => {
    renderTab({ career: "Guardsman", rank: "Conscript" });
    // Bolt is on Guardsman's table but not unlocked until Sergeant
    const button = screen.getAllByRole("button", { name: /^Bolt/ })[0];
    expect(button).toBeDisabled();
  });

  it("lets a DM open a manual-cost entry for a Locked pill, and 0 is a valid cost", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab({ career: "Guardsman", rank: "Conscript", isDM: true });

    const button = screen.getAllByRole("button", { name: /^Bolt/ })[0];
    expect(button).not.toBeDisabled();
    await user.click(button);

    expect(screen.getByText(/XP Cost to train Basic Weapon Training \(Bolt\)/)).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("0"), "0");
    await user.click(screen.getByRole("button", { name: "Train" }));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const next = onUpdate.mock.calls[0][0] as WeaponTrainingBlock;
    expect(next.trained).toContain("basic-bolt");
    expect(next.manualCosts).toEqual({ "basic-bolt": 0 });
    expect(next.xpPurchases?.["basic-bolt"]).toEqual({
      cost: 0,
      careerId: "guardsman",
      purchasedAtRankId: "conscript",
    });
  });

  it("prevents a Metallican Gunslinger acquiring new Basic or Heavy training", () => {
    renderTab({
      career: "Assassin",
      rank: "Sell-Steel",
      isDM: true,
      alternateRanks: [
        {
          alternateRankId: "metallican-gunslinger",
          replacedRankId: "sell-steel",
          takenAtTier: 1,
        },
      ],
    });

    expect(screen.getAllByRole("button", { name: /^Bolt/ })[0]).toBeDisabled();
    expect(screen.getAllByRole("button", { name: /^Bolt/ })[1]).toBeDisabled();
    expect(
      screen.getAllByText("Knave of Pistols prevents acquiring new training in this group.")
    ).toHaveLength(2);
  });

  it("allows a Metallican Gunslinger to remove Basic training they already had", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab({
      weaponTraining: makeBlock({ trained: ["basic-bolt"] }),
      alternateRanks: [
        {
          alternateRankId: "metallican-gunslinger",
          replacedRankId: "sell-steel",
          takenAtTier: 1,
        },
      ],
    });

    await user.click(screen.getAllByRole("button", { name: /^Bolt/ })[0]);
    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ trained: [] }));
  });

  it("shows exotic weapons as chips", () => {
    renderTab({
      weaponTraining: makeBlock({ exoticWeapons: [{ name: "Needle Pistol", cost: 200 }] }),
    });
    expect(screen.getByText("Needle Pistol")).toBeInTheDocument();
  });

  it("shows a confirm dialog and only calls onUpdate after confirming, when an exotic weapon chip is clicked", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab({
      weaponTraining: makeBlock({ exoticWeapons: [{ name: "Needle Pistol", cost: 200 }] }),
    });

    await user.click(screen.getByLabelText("Remove Needle Pistol"));
    expect(onUpdate).not.toHaveBeenCalled();

    expect(screen.getByText(/Remove Needle Pistol\?/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const next = onUpdate.mock.calls[0][0] as WeaponTrainingBlock;
    expect(next.exoticWeapons).toEqual([]);
  });

  it("does not call onUpdate if the remove-exotic confirm dialog is cancelled", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab({
      weaponTraining: makeBlock({ exoticWeapons: [{ name: "Needle Pistol", cost: 200 }] }),
    });

    await user.click(screen.getByLabelText("Remove Needle Pistol"));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("disables the exotic weapon chip in read-only mode", () => {
    renderTab({
      editable: false,
      weaponTraining: makeBlock({ exoticWeapons: [{ name: "Needle Pistol", cost: 200 }] }),
    });
    expect(screen.getByLabelText("Remove Needle Pistol")).toBeDisabled();
  });

  it("does not show the custom exotic weapon button to a player", () => {
    renderTab({ career: "Guardsman", rank: "Captain" });
    expect(
      screen.queryByRole("button", { name: "Add Exotic Weapon Training" })
    ).not.toBeInTheDocument();
  });

  it("shows all five glowing Mechanicus Secutor Exotic Training pills", () => {
    renderTab({
      career: "Tech-Priest",
      rank: "Enginseer",
      alternateRanks: [
        {
          alternateRankId: "mechanicus-secutor",
          replacedRankId: "enginseer",
          takenAtTier: 4,
        },
      ],
    });

    for (const [name, cost] of [
      ["Breacher", 200],
      ["Shock Blaster", 200],
      ["Graviton Gun", 300],
      ["Needle Pistol", 300],
      ["Rad-Cleanser", 300],
    ] as const) {
      const pill = screen.getByRole("button", { name: `${name}, ${cost} XP` });
      expect(pill).toBeEnabled();
      expect(pill).toHaveClass("animate-psy-pulse");
      expect(pill).toHaveAttribute("aria-pressed", "false");
    }
  });

  it("confirms and records a Mechanicus Secutor Exotic Training purchase", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab({
      career: "Tech-Priest",
      rank: "Enginseer",
      alternateRanks: [
        {
          alternateRankId: "mechanicus-secutor",
          replacedRankId: "enginseer",
          takenAtTier: 4,
        },
      ],
    });

    await user.click(screen.getByRole("button", { name: "Breacher, 200 XP" }));
    expect(onUpdate).not.toHaveBeenCalled();
    expect(
      screen.getByText("Train Exotic Weapon Training (Breacher) for 200 XP?")
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Train" }));

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        exoticWeapons: [
          {
            name: "Breacher",
            cost: 200,
            xpPurchase: {
              cost: 200,
              careerId: "tech-priest",
              sourceRankId: "enginseer",
            },
          },
        ],
      })
    );
  });

  it("does not offer an Exotic Training choice that is already owned", () => {
    renderTab({
      career: "Tech-Priest",
      rank: "Enginseer",
      weaponTraining: makeBlock({ exoticWeapons: [{ name: "Breacher", cost: 200 }] }),
      alternateRanks: [
        {
          alternateRankId: "mechanicus-secutor",
          replacedRankId: "enginseer",
          takenAtTier: 4,
        },
      ],
    });

    expect(screen.getByLabelText("Remove Breacher")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Breacher, 200 XP" })).not.toBeInTheDocument();
  });

  it("shows the custom exotic weapon button to a DM", () => {
    renderTab({ career: "Guardsman", rank: "Conscript", isDM: true });
    expect(screen.getByRole("button", { name: "Add Exotic Weapon Training" })).toBeInTheDocument();
  });

  it("opens the exotic training picker for a DM, with no slot choice", async () => {
    const user = userEvent.setup();
    renderTab({ career: "Guardsman", rank: "Captain", isDM: true });

    await user.click(screen.getByRole("button", { name: "Add Exotic Weapon Training" }));
    expect(
      screen.queryByRole("button", { name: "Use an available training slot" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Exotic Weapon Training" })).toBeInTheDocument();
    expect(screen.getByText("Needle Pistol")).toBeInTheDocument();
  });

  it("tags a DM's custom exotic weapon as bonus", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab({ career: "Guardsman", rank: "Captain", isDM: true });

    await user.click(screen.getByRole("button", { name: "Add Exotic Weapon Training" }));
    await user.click(
      within(screen.getByRole("dialog", { name: "Exotic Weapon Training" })).getByText("Web Pistol")
    );
    await user.type(screen.getByPlaceholderText("0"), "0");
    await user.click(screen.getByRole("button", { name: "+ Add Exotic" }));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const next = onUpdate.mock.calls[0][0] as WeaponTrainingBlock;
    expect(next.exoticWeapons).toEqual([
      {
        name: "Web Pistol",
        cost: 0,
        bonus: true,
        xpPurchase: { cost: 0, careerId: "guardsman", purchasedAtRankId: "captain" },
      },
    ]);
  });

  it("only offers pistol-only Exotic Weapon Training to a Metallican Gunslinger", async () => {
    const user = userEvent.setup();
    renderTab({
      isDM: true,
      alternateRanks: [
        {
          alternateRankId: "metallican-gunslinger",
          replacedRankId: "sell-steel",
          takenAtTier: 1,
        },
      ],
    });

    await user.click(screen.getByRole("button", { name: "Add Exotic Weapon Training" }));
    expect(screen.getByText("Needle Pistol")).toBeInTheDocument();
    expect(screen.getByText("Shock Blaster")).toBeInTheDocument();
    expect(screen.queryByText("Needle Rifle")).not.toBeInTheDocument();
    expect(screen.queryByText("Graviton Gun")).not.toBeInTheDocument();
    expect(screen.queryByText("Integrated Ranged Weapon")).not.toBeInTheDocument();
  });

  it("shows Talent-granted training as active, labelled, and not independently removable", () => {
    renderTab({
      talents: {
        homeworld: "",
        talents: [
          {
            uid: "blood",
            talentId: "cult-briefing",
            name: "Cult Briefing (Blood)",
            specialisation: "Blood",
            acquisition: { weaponTrainingId: "melee-chain" },
          },
          {
            uid: "guard",
            talentId: "sicarius-tutoring",
            name: "Sicarius Tutoring (Guardsman)",
            specialisation: "Guardsman",
            acquisition: { exoticWeapon: "Needle Pistol" },
          },
        ],
        traits: [],
      },
    });
    const chain = screen
      .getAllByRole("button", { name: /^Chain/ })
      .find((button) => button.getAttribute("aria-pressed") === "true")!;
    expect(chain).toBeDisabled();
    expect(
      screen.getByText(/Granted by a Talent, Trait, or Career effect: Chain/)
    ).toBeInTheDocument();
    expect(screen.getByText("Granted by Sicarius Tutoring (Guardsman)")).toBeInTheDocument();
    expect(screen.queryByLabelText("Remove Needle Pistol")).not.toBeInTheDocument();
  });
});
