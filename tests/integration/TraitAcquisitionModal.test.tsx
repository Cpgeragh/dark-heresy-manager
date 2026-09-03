import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import { TRAIT_LIST } from "../../src/data/reference/traitData";
import { TraitAcquisitionModal } from "../../src/mechanics/traits/TraitAcquisitionModal";

function renderAcquisition(traitId: string) {
  const trait = TRAIT_LIST.find((item) => item.id === traitId)!;
  const onComplete = vi.fn();
  render(
    <TraitAcquisitionModal
      trait={trait}
      entry={{ uid: `${traitId}-entry`, talentId: traitId, name: trait.name }}
      cybernetics={[]}
      onComplete={onComplete}
      onClose={vi.fn()}
    />
  );
  return onComplete;
}

describe("TraitAcquisitionModal", () => {
  it("records the chosen Soul-bound entity, consequence and roll", async () => {
    const user = userEvent.setup();
    const onComplete = renderAcquisition("soul-bound");
    await user.type(screen.getByLabelText(/Bound entity/), "The Emperor");
    await user.click(screen.getByRole("button", { name: /Permanent consequence/ }));
    await user.click(screen.getByText("Gain 1d10 Insanity Points"));
    await user.type(screen.getByLabelText(/Rolled result/), "6");
    await user.click(screen.getByRole("button", { name: "Apply and add Trait" }));
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
      entry: expect.objectContaining({
        acquisition: expect.objectContaining({
          trait: { soulBound: expect.objectContaining({ entity: "The Emperor", consequence: "insanity", rolledValue: 6 }) },
        }),
      }),
    }));
  });

  it("requires exactly three Blank Slate Skills", async () => {
    const user = userEvent.setup();
    const onComplete = renderAcquisition("blank-slate");
    const apply = screen.getByRole("button", { name: "Apply and add Trait" });
    expect(apply).toBeDisabled();
    await user.click(screen.getByText("Common Lore (Adeptus Arbites)"));
    await user.click(screen.getByText("Common Lore (Machine Cult)"));
    await user.click(screen.getByText("Common Lore (Administratum)"));
    expect(apply).toBeEnabled();
    await user.click(apply);
    expect(onComplete.mock.calls[0][0].entry.acquisition.trait.blankSlateSkillIds).toHaveLength(3);
  });

  it("records a Sanctioning result and age roll", async () => {
    const user = userEvent.setup();
    const onComplete = renderAcquisition("sanctioned-psyker");
    await user.click(screen.getByRole("button", { name: /Sanctioning side effect/ }));
    await user.click(screen.getByText("Witch Prickling"));
    await user.type(screen.getByLabelText(/Starting age increase/), "18");
    await user.click(screen.getByRole("button", { name: "Apply and add Trait" }));
    expect(onComplete.mock.calls[0][0].entry.acquisition.trait.sanctioning).toEqual(expect.objectContaining({
      resultId: "witch-prickling",
      ageIncrease: 18,
    }));
  });

  it("grants Carven Dentures when Dental Probes is rolled", async () => {
    const user = userEvent.setup();
    const onComplete = renderAcquisition("sanctioned-psyker");
    await user.click(screen.getByRole("button", { name: /Sanctioning side effect/ }));
    await user.click(screen.getByText("Dental Probes"));
    await user.type(screen.getByLabelText(/Starting age increase/), "12");
    await user.click(screen.getByRole("button", { name: "Apply and add Trait" }));
    expect(onComplete.mock.calls[0][0].gear).toEqual([
      expect.objectContaining({ name: "Carven Dentures", referenceId: "cr-carven-dentures" }),
    ]);
  });

  it("grants a Chattallium Ring when Throne Wed is rolled", async () => {
    const user = userEvent.setup();
    const onComplete = renderAcquisition("sanctioned-psyker");
    await user.click(screen.getByRole("button", { name: /Sanctioning side effect/ }));
    await user.click(screen.getByText("Throne Wed"));
    await user.type(screen.getByLabelText(/Starting age increase/), "20");
    await user.click(screen.getByRole("button", { name: "Apply and add Trait" }));
    expect(onComplete.mock.calls[0][0].gear).toEqual([
      expect.objectContaining({ name: "Chattallium Ring", referenceId: "cr-chattallium-ring" }),
    ]);
  });

  it("notes the Willpower Test requirement when Tongue Bound is rolled", async () => {
    const user = userEvent.setup();
    const onComplete = renderAcquisition("sanctioned-psyker");
    await user.click(screen.getByRole("button", { name: /Sanctioning side effect/ }));
    await user.click(screen.getByText("Tongue Bound"));
    await user.type(screen.getByLabelText(/Starting age increase/), "10");
    await user.click(screen.getByRole("button", { name: "Apply and add Trait" }));
    expect(onComplete.mock.calls[0][0].entry.notes).toContain("Hard (–20) Willpower Test");
  });

  it("installs the Common cybernetic granted by Skin of Iron", async () => {
    const user = userEvent.setup();
    const onComplete = renderAcquisition("skin-of-iron");
    await user.click(screen.getByRole("button", { name: /Cybernetic/ }));
    await user.click(screen.getByText("Bionic Respiratory System"));
    await user.click(screen.getByRole("button", { name: "Apply and add Trait" }));
    expect(onComplete.mock.calls[0][0].cybernetics).toEqual([
      expect.objectContaining({ name: "Bionic Respiratory System", craftsmanship: "Common" }),
    ]);
  });

  it("records later Skin of Iron upgrades and changes the existing cybernetic to Good", async () => {
    const user = userEvent.setup();
    const trait = TRAIT_LIST.find((item) => item.id === "skin-of-iron")!;
    const onComplete = vi.fn();
    render(
      <TraitAcquisitionModal
        trait={trait}
        entry={{ uid: "skin-rank-3", talentId: trait.id, name: trait.name }}
        ownedTraitEntries={[{ uid: "skin-rank-1", talentId: trait.id, name: trait.name }]}
        cybernetics={[{ id: "lungs", referenceId: "cr-bionic-respiratory-system", name: "Bionic Respiratory System", craftsmanship: "Common" }]}
        onComplete={onComplete}
        onClose={vi.fn()}
      />
    );
    await user.click(screen.getByRole("button", { name: /Rank 3 benefit/ }));
    await user.click(screen.getByText("Upgrade an existing cybernetic to Good"));
    await user.click(screen.getByRole("button", { name: /Cybernetic to upgrade/ }));
    await user.click(screen.getByText("Bionic Respiratory System (Common)"));
    await user.click(screen.getByRole("button", { name: "Apply and add Trait" }));
    expect(onComplete.mock.calls[0][0]).toEqual(expect.objectContaining({
      cybernetics: [expect.objectContaining({ id: "lungs", craftsmanship: "Good" })],
      entry: expect.objectContaining({
        acquisition: expect.objectContaining({
          trait: { skinOfIronGrants: [expect.objectContaining({ rank: 3, kind: "upgrade", cyberneticId: "lungs", previousCraftsmanship: "Common" })] },
        }),
      }),
    }));
  });
});
