// functions/tests/shared/validation.test.ts
import { describe, it, expect } from "vitest";
import { assertRequestFields } from "../../src/shared/validation";

describe("assertRequestFields", () => {
  it("accepts data containing only allowed fields", () => {
    expect(() => assertRequestFields({ code: "DH-ABCD-1234" }, ["code"])).not.toThrow();
  });

  it("rejects an unexpected field", () => {
    expect(() =>
      assertRequestFields({ code: "DH-ABCD-1234", extra: true }, ["code"])
    ).toThrow(expect.objectContaining({ code: "invalid-argument" }));
  });

  it("rejects data missing a required field", () => {
    expect(() => assertRequestFields({}, ["code"], ["code"])).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("accepts data with all required fields present, extra optional fields omitted", () => {
    expect(() =>
      assertRequestFields({ code: "DH-ABCD-1234" }, ["code", "note"], ["code"])
    ).not.toThrow();
  });

  it("rejects non-object request data", () => {
    expect(() => assertRequestFields("not-an-object", ["code"])).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
    expect(() => assertRequestFields(null, ["code"])).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
    expect(() => assertRequestFields(["array"], ["code"])).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });
});
