// functions/tests/shared/validation.test.ts
import { describe, it, expect } from "vitest";
import { assertRequestFields, assertFieldShapes } from "../../src/shared/validation";

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

describe("assertFieldShapes", () => {
  it("accepts a non-empty string for a plain string field", () => {
    expect(() =>
      assertFieldShapes({ campaignId: "campaign-1" }, { campaignId: "string" })
    ).not.toThrow();
  });

  it("rejects an empty string", () => {
    expect(() => assertFieldShapes({ campaignId: "" }, { campaignId: "string" })).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("rejects a non-string value", () => {
    expect(() => assertFieldShapes({ campaignId: 123 }, { campaignId: "string" })).toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("skips a field that is absent, leaving that to assertRequestFields' required check", () => {
    expect(() => assertFieldShapes({}, { campaignId: "string" })).not.toThrow();
  });

  it("accepts a value matching an enum shape", () => {
    expect(() =>
      assertFieldShapes({ mode: "remove" }, { mode: { enum: ["update", "remove"] } })
    ).not.toThrow();
  });

  it("rejects a value not in the enum shape", () => {
    expect(() =>
      assertFieldShapes({ mode: "delete-everything" }, { mode: { enum: ["update", "remove"] } })
    ).toThrow(expect.objectContaining({ code: "invalid-argument" }));
  });
});
