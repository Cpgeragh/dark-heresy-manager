import { act, renderHook } from "@testing-library/react";
import type { User } from "firebase/auth";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  next: undefined as unknown as (user: User | null) => Promise<void>,
  fail: undefined as unknown as (error: Error) => void,
  signInAnonymously: vi.fn(),
  synchroniseUserAccount: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn(
    (_auth: unknown, next: (user: User | null) => Promise<void>, fail: (error: Error) => void) => {
      authMocks.next = next;
      authMocks.fail = fail;
      return authMocks.unsubscribe;
    }
  ),
  signInAnonymously: authMocks.signInAnonymously,
}));

vi.mock("../../src/firebase", () => ({ auth: {} }));
vi.mock("../../src/services/userAccountService", () => ({
  synchroniseUserAccount: authMocks.synchroniseUserAccount,
}));

import { useAuth } from "../../src/hooks/useAuth";

const user = { uid: "user-1" } as User;

describe("useAuth startup", () => {
  beforeEach(() => {
    authMocks.signInAnonymously.mockReset();
    authMocks.synchroniseUserAccount.mockReset();
    authMocks.unsubscribe.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("hands a first anonymous sign-in to the signed-in observer callback", async () => {
    authMocks.signInAnonymously.mockResolvedValue({ user });
    authMocks.synchroniseUserAccount.mockResolvedValue(false);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await authMocks.next(null);
    });

    expect(authMocks.signInAnonymously).toHaveBeenCalledOnce();
    expect(authMocks.synchroniseUserAccount).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(true);

    await act(async () => {
      await authMocks.next(user);
    });

    expect(authMocks.synchroniseUserAccount).toHaveBeenCalledOnce();
    expect(authMocks.synchroniseUserAccount).toHaveBeenCalledWith(user.uid);
    expect(result.current).toMatchObject({
      currentUser: user,
      loading: false,
      error: null,
      onboarded: false,
    });
  });

  it("exposes anonymous sign-in failures and ends loading", async () => {
    const failure = new Error("sign-in failed");
    authMocks.signInAnonymously.mockRejectedValue(failure);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await authMocks.next(null);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(failure);
    expect(result.current.currentUser).toBeNull();
  });

  it("exposes Auth observer failures and ends loading", () => {
    const failure = new Error("observer failed");
    const { result } = renderHook(() => useAuth());

    act(() => authMocks.fail(failure));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(failure);
  });
});
