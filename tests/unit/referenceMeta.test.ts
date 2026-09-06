import { describe, expect, it } from "vitest";
import { isVariableMeta } from "../../src/data/reference/referenceMeta";

describe("isVariableMeta", () => {
  it.each([undefined, null, "", "   ", "\u2014", "variable", "VARIES"])(
    "recognises %s as variable metadata",
    (value) => {
      expect(isVariableMeta(value)).toBe(true);
    }
  );

  it.each(["0", "100 Thrones", "Common", "Issued Only"])(
    "recognises %s as fixed metadata",
    (value) => {
      expect(isVariableMeta(value)).toBe(false);
    }
  );
});
