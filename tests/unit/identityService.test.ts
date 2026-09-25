// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from "vitest";

const { callReveal, callRegister, callCreate } = vi.hoisted(() => ({
  callReveal: vi.fn(),
  callRegister: vi.fn(),
  callCreate: vi.fn(),
}));
vi.mock("firebase/functions", () => ({
  httpsCallable: vi.fn((_functions: unknown, name: string) => {
    if (name === "registerIdentityCode") return callRegister;
    if (name === "revealIdentityCode") return callReveal;
    if (name === "createAccount") return callCreate;
    throw new Error(`Unexpected callable: ${name}`);
  }),
}));
vi.mock("../../src/firebase", () => ({ functions: "functions" }));

import {
  createAccount,
  getRecoveryCode,
  rotateRecoveryCode,
} from "../../src/services/identityService";

beforeEach(() => {
  vi.clearAllMocks();
  callCreate.mockResolvedValue({ data: { accountId: "account-1", code: "DH-AAAA-BBBB" } });
  callRegister.mockResolvedValue({ data: { code: "DH-CCCC-DDDD" } });
  callReveal.mockResolvedValue({ data: { code: "DH-AAAA-BBBB" } });
});

it("creates an account through the server", async () => {
  await expect(createAccount("My phone")).resolves.toEqual({
    accountId: "account-1",
    code: "DH-AAAA-BBBB",
  });
  expect(callCreate).toHaveBeenCalledWith({ deviceName: "My phone" });
});

it("reads an existing account recovery code", async () => {
  await expect(getRecoveryCode("account-1")).resolves.toBe("DH-AAAA-BBBB");
  expect(callReveal).toHaveBeenCalledWith({});
});

it("rotates the account recovery code through a server operation", async () => {
  await expect(rotateRecoveryCode("account-1", "dm")).resolves.toBe("DH-CCCC-DDDD");
  expect(callRegister).toHaveBeenCalledWith({});
});
