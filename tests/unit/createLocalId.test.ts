import { afterEach, describe, expect, it, vi } from "vitest";
import { createLocalId } from "../../src/utils/createLocalId";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("createLocalId", () => {
  it("prefers a platform UUID when available", () => {
    const randomUUID = vi.fn(() => "generated-uuid");
    vi.stubGlobal("crypto", { randomUUID });

    expect(createLocalId("trauma")).toBe("generated-uuid");
    expect(randomUUID).toHaveBeenCalledOnce();
  });

  it("uses the supplied prefix in its fallback ID", () => {
    vi.stubGlobal("crypto", {});
    vi.spyOn(Date, "now").mockReturnValue(1234567890);
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    expect(createLocalId("mutation")).toBe(`mutation-1234567890-${(0.5).toString(36).slice(2)}`);
  });
});
