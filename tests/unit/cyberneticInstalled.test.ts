import { describe, expect, it } from "vitest";
import { isInstalled } from "../../src/utils/cyberneticInstalled";
import { bionicBonusAt } from "../../src/pages/CharacterSheet/ArmourTab/armourHelpers";

describe("isInstalled", () => {
  it("treats a missing value as installed", () => {
    expect(isInstalled({})).toBe(true);
  });

  it("reads true as installed and false as not installed", () => {
    expect(isInstalled({ installed: true })).toBe(true);
    expect(isInstalled({ installed: false })).toBe(false);
  });
});

describe("bionicBonusAt", () => {
  it("gives +2 for an installed implant at the location", () => {
    expect(
      bionicBonusAt("rightArm", [{ id: "arm", name: "Bionic Arm", bodyLocation: ["rightArm"] }])
    ).toBe(2);
  });

  it("gives nothing for an implant that is not installed", () => {
    expect(
      bionicBonusAt("rightArm", [
        { id: "arm", name: "Bionic Arm", bodyLocation: ["rightArm"], installed: false },
      ])
    ).toBe(0);
  });

  it("gives nothing at a location with no implant", () => {
    expect(
      bionicBonusAt("leftArm", [{ id: "arm", name: "Bionic Arm", bodyLocation: ["rightArm"] }])
    ).toBe(0);
  });
});
