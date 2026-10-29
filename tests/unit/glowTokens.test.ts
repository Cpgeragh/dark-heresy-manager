import { describe, expect, it } from "vitest";

import { psyRatingPulseVars } from "../../src/pages/CharacterSheet/PsychicTab/psychicStyles";
import {
  colourControlShadow,
  colourGlowSilver,
  colourShadowRaised,
  colourShadowStrong,
} from "../../src/ui/styles/colourTokens";

describe("shadow and glow tokens", () => {
  it("keeps the shared shadow classes unchanged", () => {
    expect(colourShadowStrong).toBe("shadow-2xl");
    expect(colourShadowRaised).toBe("shadow-lg");
    expect(colourControlShadow).toBe("shadow-lg shadow-black/40");
    expect(colourGlowSilver).toBe("shadow-[0_0_10px_1px_rgba(203,213,225,0.25)]");
  });

  it("builds the Psy Rating pulse from the shared indigo colour", () => {
    expect(psyRatingPulseVars(1)).toEqual({
      "--glow-lo": "0 0 6px rgba(129,140,248,0.35)",
      "--glow-hi": "0 0 10px rgba(129,140,248,0.55)",
    });
    expect(psyRatingPulseVars(6)).toEqual({
      "--glow-lo": "0 0 24px rgba(129,140,248,0.9)",
      "--glow-hi": "0 0 32px rgba(129,140,248,0.98)",
    });
  });

  it("keeps the Psy Rating strength within the supported ratings", () => {
    expect(psyRatingPulseVars(0)).toEqual(psyRatingPulseVars(1));
    expect(psyRatingPulseVars(9)).toEqual(psyRatingPulseVars(6));
  });
});
