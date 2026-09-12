// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { linkDevice, resetLink } = vi.hoisted(() => ({ linkDevice: vi.fn(), resetLink: vi.fn() }));
vi.mock("../../src/hooks/useLinkDevice", () => ({
  useLinkDevice: () => ({ linkDevice, loading: false, error: null, reset: resetLink }),
}));
import { useIdentityRecoveryFlow } from "../../src/hooks/useIdentityRecoveryFlow";

beforeEach(() => {
  vi.clearAllMocks();
  linkDevice.mockResolvedValue(undefined);
});

describe("useIdentityRecoveryFlow", () => {
  it("connects directly without a reclaim/check mode", async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useIdentityRecoveryFlow());
    act(() => result.current.setCode("AAAABBBB"));
    await act(() => result.current.link(onSuccess));
    expect(linkDevice).toHaveBeenCalledWith("DH-AAAA-BBBB");
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(result.current.phase).toBe("finishing");
  });

  it("reset clears the code and ignores an in-flight completion", async () => {
    let finish!: () => void;
    linkDevice.mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      })
    );
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useIdentityRecoveryFlow());
    act(() => result.current.setCode("AAAABBBB"));
    let request!: Promise<void>;
    act(() => {
      request = result.current.link(onSuccess);
    });
    act(() => result.current.reset());
    await act(async () => {
      finish();
      await request;
    });
    expect(result.current.code).toBe("");
    expect(result.current.phase).toBe("idle");
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
