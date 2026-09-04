// tests/integration/ConcealedWeaponBionicInstaller.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ConcealedWeaponBionicInstaller } from "../../src/pages/CharacterSheet/CyberneticsTab/ConcealedWeaponBionicInstaller";
import type { CyberneticItem, RangedWeapon } from "../../src/types/Character";

// "cr-bionic-arm" is the real Bionic Arm reference id (src/data/reference/cyberneticsReference.ts).
const BIONIC_ARM_REF_ID = "cr-bionic-arm";

function renderInstaller(props: Partial<React.ComponentProps<typeof ConcealedWeaponBionicInstaller>> = {}) {
  const onInstall = vi.fn();
  const onClose = vi.fn();
  render(
    <ConcealedWeaponBionicInstaller
      cybernetics={[]}
      rangedWeapons={[]}
      meleeWeapons={[]}
      strengthBonus={3}
      onInstall={onInstall}
      onClose={onClose}
      {...props}
    />
  );
  return { onInstall, onClose };
}

describe("ConcealedWeaponBionicInstaller", () => {
  it("shows a placeholder when there is no Bionic Arm installed", () => {
    renderInstaller();
    expect(
      screen.getByText("Install a Bionic Arm before installing this upgrade.")
    ).toBeInTheDocument();
  });

  it("only lists cybernetics matching the real Bionic Arm reference id", () => {
    const arm: CyberneticItem = { id: "arm-1", name: "Bionic Arm", referenceId: BIONIC_ARM_REF_ID };
    const other: CyberneticItem = { id: "c1", name: "Auto-Quill", referenceId: "auto-quill" };
    renderInstaller({ cybernetics: [arm, other] });

    expect(screen.getByText("Bionic Arm")).toBeInTheDocument();
    expect(screen.queryByText("Auto-Quill")).not.toBeInTheDocument();
  });

  it("moves to weapon selection after choosing an arm, listing only eligible pistols", async () => {
    const user = userEvent.setup();
    const arm: CyberneticItem = { id: "arm-1", name: "Bionic Arm", referenceId: BIONIC_ARM_REF_ID };
    const eligiblePistol: RangedWeapon = {
      id: "r1",
      name: "Laspistol",
      damage: "1d10+2",
      pen: "0",
      class: "Pistol",
    };
    const alreadyConcealed: RangedWeapon = {
      id: "r2",
      name: "Stub Revolver",
      damage: "1d10+3",
      pen: "0",
      class: "Pistol",
      concealedBionic: { cyberneticId: "other", craftsmanship: "Common" },
    };
    const notAPistol: RangedWeapon = {
      id: "r3",
      name: "Lasgun",
      damage: "1d10+3",
      pen: "0",
      class: "Basic",
    };
    renderInstaller({
      cybernetics: [arm],
      rangedWeapons: [eligiblePistol, alreadyConcealed, notAPistol],
    });

    await user.click(screen.getByRole("button", { name: "Select Bionic Arm" }));

    expect(screen.getByText("Laspistol")).toBeInTheDocument();
    expect(screen.queryByText("Stub Revolver")).not.toBeInTheDocument();
    expect(screen.queryByText("Lasgun")).not.toBeInTheDocument();
  });

  it("shows a placeholder when no eligible weapon exists", async () => {
    const user = userEvent.setup();
    const arm: CyberneticItem = { id: "arm-1", name: "Bionic Arm", referenceId: BIONIC_ARM_REF_ID };
    renderInstaller({ cybernetics: [arm] });

    await user.click(screen.getByRole("button", { name: "Select Bionic Arm" }));

    expect(
      screen.getByText("Add an eligible weapon before installing this upgrade.")
    ).toBeInTheDocument();
  });

  it("completes the install with the chosen arm and weapon", async () => {
    const user = userEvent.setup();
    const arm: CyberneticItem = { id: "arm-1", name: "Bionic Arm", referenceId: BIONIC_ARM_REF_ID };
    const pistol: RangedWeapon = {
      id: "r1",
      name: "Laspistol",
      damage: "1d10+2",
      pen: "0",
      class: "Pistol",
    };
    const { onInstall } = renderInstaller({ cybernetics: [arm], rangedWeapons: [pistol] });

    await user.click(screen.getByRole("button", { name: "Select Bionic Arm" }));
    await user.click(screen.getByRole("button", { name: "Select Weapon" }));

    expect(onInstall).toHaveBeenCalledWith("arm-1", { id: "r1", type: "ranged", name: "Laspistol" });
  });

  it("returns to arm selection via Back", async () => {
    const user = userEvent.setup();
    const arm: CyberneticItem = { id: "arm-1", name: "Bionic Arm", referenceId: BIONIC_ARM_REF_ID };
    renderInstaller({ cybernetics: [arm] });

    await user.click(screen.getByRole("button", { name: "Select Bionic Arm" }));
    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(screen.getByRole("button", { name: "Select Bionic Arm" })).toBeInTheDocument();
  });

  it("calls onClose from Cancel", async () => {
    const user = userEvent.setup();
    const { onClose } = renderInstaller();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
  });
});
