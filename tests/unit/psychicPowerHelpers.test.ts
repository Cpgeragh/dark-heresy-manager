import { describe, expect, it } from "vitest";
import { toCustomPowerData } from "../../src/pages/CharacterSheet/PsychicTab/psychicPowerHelpers";
import type { PsychicPower } from "../../src/types/Character";

describe("toCustomPowerData", () => {
  it("keeps one character's personal note out of the reusable definition", () => {
    const power = {
      id: "p1",
      name: "Smite",
      customLibraryId: "lib",
      customLibraryVersionId: "v1",
      personalNotes: "Mine",
    } as PsychicPower;

    expect(toCustomPowerData(power)).toEqual({ name: "Smite" });
  });
});
