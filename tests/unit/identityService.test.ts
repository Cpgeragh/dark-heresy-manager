// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from "vitest";

const { mockDoc, mockGetDoc, callRegister, callCreate } = vi.hoisted(() => ({
  mockDoc: vi.fn((...args: unknown[]) => `${args[1]}/${args[2]}`),
  mockGetDoc: vi.fn(),
  callRegister: vi.fn(),
  callCreate: vi.fn(),
}));
vi.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
}));
vi.mock("firebase/functions", () => ({
  httpsCallable: vi.fn((_functions: unknown, name: string) => {
    if (name === "registerIdentityCode") return callRegister;
    if (name === "createAccount") return callCreate;
    throw new Error(`Unexpected callable: ${name}`);
  }),
}));
vi.mock("../../src/firebase", () => ({ db: "db", functions: "functions" }));

import {
  createAccount,
  getRecoveryCode,
  rotateRecoveryCode,
} from "../../src/services/identityService";

beforeEach(() => {
  vi.clearAllMocks();
  callCreate.mockResolvedValue({ data: { accountId: "account-1", code: "DH-AAAA-BBBB" } });
  callRegister.mockResolvedValue({ data: { code: "DH-CCCC-DDDD" } });
});

it("creates an account through the server", async () => {
  await expect(createAccount("My phone")).resolves.toEqual({
    accountId: "account-1",
    code: "DH-AAAA-BBBB",
  });
  expect(callCreate).toHaveBeenCalledWith({ deviceName: "My phone" });
});

it("reads an existing account recovery code", async () => {
  mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ code: "DH-AAAA-BBBB" }) });
  await expect(getRecoveryCode("account-1")).resolves.toBe("DH-AAAA-BBBB");
});

it("rotates the account recovery code through a server operation", async () => {
  await expect(rotateRecoveryCode("account-1", "dm")).resolves.toBe("DH-CCCC-DDDD");
  expect(callRegister).toHaveBeenCalledWith({});
});
