// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getIdentityRecoveryModeMock, linkDeviceMock, reclaimIdentityMock, resetLinkDeviceMock } =
  vi.hoisted(() => ({
    getIdentityRecoveryModeMock: vi.fn(),
    linkDeviceMock: vi.fn(),
    reclaimIdentityMock: vi.fn(),
    resetLinkDeviceMock: vi.fn(),
  }));

vi.mock("../../src/hooks/useLinkDevice", () => ({
  useLinkDevice: () => ({
    linkDevice: linkDeviceMock,
    loading: false,
    error: null,
    reset: resetLinkDeviceMock,
  }),
}));

vi.mock("../../src/services/identityService", () => ({
  getIdentityRecoveryMode: getIdentityRecoveryModeMock,
  reclaimIdentity: reclaimIdentityMock,
}));

import { useIdentityRecoveryFlow } from "../../src/hooks/useIdentityRecoveryFlow";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.clearAllMocks();
  getIdentityRecoveryModeMock.mockResolvedValue("link");
  linkDeviceMock.mockResolvedValue(undefined);
  reclaimIdentityMock.mockResolvedValue({ role: "player", profileTransferred: true });
});

describe("useIdentityRecoveryFlow", () => {
  it("clears the recovery code and discovered mode when reset", async () => {
    const { result } = renderHook(() => useIdentityRecoveryFlow());

    act(() => result.current.setCode("ABCD1234"));
    await act(() => result.current.check());
    expect(result.current.mode).toBe("link");

    act(() => result.current.reset());

    expect(result.current.code).toBe("");
    expect(result.current.mode).toBeNull();
    expect(result.current.phase).toBe("idle");
    expect(resetLinkDeviceMock).toHaveBeenCalledOnce();
  });

  it("ignores a lookup result that arrives after reset", async () => {
    const lookup = deferred<"link">();
    getIdentityRecoveryModeMock.mockReturnValue(lookup.promise);
    const { result } = renderHook(() => useIdentityRecoveryFlow());
    let request!: Promise<void>;

    act(() => result.current.setCode("ABCD1234"));
    act(() => {
      request = result.current.check();
    });
    expect(result.current.phase).toBe("checking");

    act(() => result.current.reset());
    await act(async () => {
      lookup.resolve("link");
      await request;
    });

    expect(result.current.code).toBe("");
    expect(result.current.mode).toBeNull();
    expect(result.current.phase).toBe("idle");
  });

  it("does not finish linking after the flow has been reset", async () => {
    const link = deferred<void>();
    linkDeviceMock.mockReturnValue(link.promise);
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useIdentityRecoveryFlow());

    act(() => result.current.setCode("ABCD1234"));
    await act(() => result.current.check());

    let request!: Promise<void>;
    act(() => {
      request = result.current.link(onSuccess);
    });
    expect(result.current.phase).toBe("linking");

    act(() => result.current.reset());
    await act(async () => {
      link.resolve();
      await request;
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(result.current.phase).toBe("idle");
  });

  it("does not finish reclaiming after the flow has been reset", async () => {
    getIdentityRecoveryModeMock.mockResolvedValue("reclaim");
    const reclaim = deferred<{ role: "player"; profileTransferred: true }>();
    reclaimIdentityMock.mockReturnValue(reclaim.promise);
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useIdentityRecoveryFlow());

    act(() => result.current.setCode("ABCD1234"));
    await act(() => result.current.check());

    let request!: Promise<void>;
    act(() => {
      request = result.current.reclaim(onSuccess);
    });
    expect(result.current.phase).toBe("reclaiming");

    act(() => result.current.reset());
    await act(async () => {
      reclaim.resolve({ role: "player", profileTransferred: true });
      await request;
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(result.current.phase).toBe("idle");
  });
});
