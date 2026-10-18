import { describe, expect, it } from "vitest";
import { isSessionOpen } from "../../src/utils/sessionStatus";

describe("isSessionOpen", () => {
  it("is true only for an open session", () => {
    expect(isSessionOpen({ status: "open" })).toBe(true);
    expect(isSessionOpen({ status: "closed" })).toBe(false);
  });

  it("treats a session with no status as closed", () => {
    expect(isSessionOpen({})).toBe(false);
  });
});
