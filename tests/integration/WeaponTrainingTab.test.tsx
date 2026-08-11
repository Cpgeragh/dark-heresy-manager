// tests/integration/WeaponTrainingTab.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { WeaponTrainingTab } from "../../src/pages/characterSheet/WeaponTrainingTab";
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
    expect(screen.getAllByRole("button", { name: "Bolt" })[0]).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Chain" })[0]).toBeInTheDocument();
  });

  it("adds a training id through onUpdate when an untrained button is clicked", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab();

    await user.click(screen.getAllByRole("button", { name: "Bolt" })[0]);

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const next = onUpdate.mock.calls[0][0] as WeaponTrainingBlock;
    expect(next.trained).toContain("basic-bolt");
  });

  it("removes a training id through onUpdate when an already-trained button is clicked", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab({ weaponTraining: makeBlock({ trained: ["basic-bolt"] }) });

    await user.click(screen.getAllByRole("button", { name: "Bolt" })[0]);

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const next = onUpdate.mock.calls[0][0] as WeaponTrainingBlock;
    expect(next.trained).not.toContain("basic-bolt");
  });

  it("shows trained buttons as pressed", () => {
    renderTab({ weaponTraining: makeBlock({ trained: ["basic-bolt"] }) });
    expect(screen.getAllByRole("button", { name: "Bolt" })[0]).toHaveAttribute("aria-pressed", "true");
  });

  it("disables training buttons and ignores clicks in read-only mode", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab({ editable: false });

    const button = screen.getAllByRole("button", { name: "Bolt" })[0];
    expect(button).toBeDisabled();

    await user.click(button);
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("shows exotic weapons as chips", () => {
    renderTab({ weaponTraining: makeBlock({ exoticWeapons: ["Needle Pistol"] }) });
    expect(screen.getByText("Needle Pistol")).toBeInTheDocument();
  });

  it("shows 'None.' when there are no exotic weapons in read-only mode", () => {
    renderTab({ editable: false });
    expect(screen.getByText("None.")).toBeInTheDocument();
  });

  it("hides the exotic weapon add affordance in read-only mode", () => {
    renderTab({ editable: false });
    expect(screen.queryByRole("button", { name: "Add Exotic Weapon" })).not.toBeInTheDocument();
  });

  it("adds an exotic weapon through the modal", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab();

    await user.click(screen.getByRole("button", { name: "Add Exotic Weapon" }));
    await user.type(screen.getByPlaceholderText("e.g. Needle Pistol"), "Needle Pistol");
    await user.click(screen.getByRole("button", { name: "+ Add Exotic" }));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const next = onUpdate.mock.calls[0][0] as WeaponTrainingBlock;
    expect(next.exoticWeapons).toEqual(["Needle Pistol"]);
  });

  it("removes an exotic weapon through onUpdate", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab({ weaponTraining: makeBlock({ exoticWeapons: ["Needle Pistol"] }) });

    await user.click(screen.getByLabelText("Remove Needle Pistol"));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const next = onUpdate.mock.calls[0][0] as WeaponTrainingBlock;
    expect(next.exoticWeapons).toEqual([]);
  });
});
