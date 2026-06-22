// tests/integration/WeaponsTab.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { WeaponsTab } from "../../src/pages/characterSheet/WeaponsTab";
import type {
  RangedWeapon,
  MeleeWeapon,
  CyberneticItem,
  ArcheotechItem,
} from "../../src/types/Character";

const ranged: RangedWeapon = { id: "r1", name: "Lasgun", damage: "1d10+3", pen: "0" };
const melee: MeleeWeapon = { id: "m1", name: "Chainsword", damage: "1d10+2", pen: "2" };

function renderTab(props: Partial<React.ComponentProps<typeof WeaponsTab>> = {}) {
  const noop = vi.fn();
  render(
    <WeaponsTab
      rangedWeapons={[ranged]}
      meleeWeapons={[melee]}
      grenades={[]}
      editable={true}
      strengthBonus={4}
      onUpdateRanged={noop}
      onUpdateMelee={noop}
      onUpdateGrenades={noop}
      shields={[]}
      onUpdateShields={noop}
      cybernetics={[] as CyberneticItem[]}
      archeotech={[] as ArcheotechItem[]}
      onUpdateArcheotech={noop}
      {...props}
    />
  );
  return { noop };
}

describe("WeaponsTab", () => {
  it("renders the Ranged and Melee sections", () => {
    renderTab();
    expect(screen.getByText("Ranged")).toBeInTheDocument();
    expect(screen.getByText("Melee")).toBeInTheDocument();
  });

  it("renders provided weapons by name", () => {
    renderTab();
    expect(screen.getByText("Lasgun")).toBeInTheDocument();
    expect(screen.getByText("Chainsword")).toBeInTheDocument();
  });

  it("shows empty states when there are no weapons", () => {
    renderTab({ rangedWeapons: [], meleeWeapons: [] });
    expect(screen.getByText("No ranged weapons.")).toBeInTheDocument();
    expect(screen.getByText("No melee weapons.")).toBeInTheDocument();
  });

  it("shows add affordances when editable", () => {
    renderTab({ rangedWeapons: [], meleeWeapons: [] });
    expect(screen.getAllByText("+ Add").length).toBeGreaterThanOrEqual(2);
  });

  it("shows 'View' labels in read-only mode", () => {
    renderTab({ editable: false, rangedWeapons: [], meleeWeapons: [] });
    expect(screen.getAllByText("View").length).toBeGreaterThanOrEqual(2);
  });

  it("shows only rounds for loose-loaded ranged ammo", () => {
    renderTab({
      meleeWeapons: [],
      rangedWeapons: [
        {
          id: "shotgun",
          referenceId: "cr-shotgun",
          name: "Shotgun",
          class: "Basic",
          clip: "2",
          weight: "5 kg",
          equipped: true,
          ammoEntries: [
            {
              id: "shells",
              referenceId: "cr-shells",
              name: "Shells",
              clips: 3,
              rounds: 1,
              loaded: true,
            },
          ],
        },
      ],
    });

    expect(screen.getByText("Rounds")).toBeInTheDocument();
    expect(screen.queryByText("Clips")).not.toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("shows clips and rounds for clip-fed ranged ammo", () => {
    renderTab({
      meleeWeapons: [],
      rangedWeapons: [
        {
          id: "autogun",
          referenceId: "cr-autogun",
          name: "Autogun",
          class: "Basic",
          clip: "30",
          weight: "5 kg",
          equipped: true,
          ammoEntries: [
            {
              id: "bullets",
              referenceId: "cr-bullets",
              name: "Bullets",
              clips: 2,
              rounds: 5,
              loaded: true,
            },
          ],
        },
      ],
    });

    expect(screen.getByText("Clips")).toBeInTheDocument();
    expect(screen.getByText("Rounds")).toBeInTheDocument();
  });
});
