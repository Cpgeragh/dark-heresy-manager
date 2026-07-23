import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useInstallMode } from "../../src/hooks/useInstallMode";

describe("useInstallMode", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("defaults to full mode and persists the default", async () => {
    const { result } = renderHook(() => useInstallMode());

    expect(result.current).toBe("full");
    await waitFor(() => expect(localStorage.getItem("installMode")).toBe("full"));
  });

  it("uses an invite parameter instead of the stored mode", async () => {
    localStorage.setItem("installMode", "full");
    window.history.replaceState({}, "", "/?invite=player");

    const { result } = renderHook(() => useInstallMode());

    expect(result.current).toBe("player");
    await waitFor(() => expect(localStorage.getItem("installMode")).toBe("player"));
  });

  it("retains a valid stored mode when there is no invite parameter", () => {
    localStorage.setItem("installMode", "player");

    const { result } = renderHook(() => useInstallMode());

    expect(result.current).toBe("player");
  });
});
