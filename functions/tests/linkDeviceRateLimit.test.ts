import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { hashForKey, hashRecoveryCode } from "../src/shared/recoveryCode";

const protectedCallableMock = vi.hoisted(() => vi.fn((options: unknown) => options));

vi.mock("firebase-admin/app", () => ({ initializeApp: vi.fn() }));
vi.mock("../src/shared/protectedCallable.js", () => ({
  protectedCallable: protectedCallableMock,
}));

type LinkDeviceCallable = {
  run: (request: {
    auth: { uid: string };
    data: { code: string; deviceName: string };
  }) => Promise<unknown> | unknown;
};

type ProtectedCallableOptions = {
  rateLimits: Array<{ key: string; limit: number; windowMs: number }>;
};

const identitySecret = "identity-rate-limit-secret";
const previousIdentitySecret = process.env.IDENTITY_CODE_HMAC_SECRET;

let linkDevice: LinkDeviceCallable;

beforeAll(async () => {
  process.env.IDENTITY_CODE_HMAC_SECRET = identitySecret;
  const exportedFunctions = await import("../src/index");
  linkDevice = exportedFunctions.linkDevice as LinkDeviceCallable;
});

beforeEach(() => {
  protectedCallableMock.mockClear();
});

afterAll(() => {
  if (previousIdentitySecret === undefined) {
    delete process.env.IDENTITY_CODE_HMAC_SECRET;
  } else {
    process.env.IDENTITY_CODE_HMAC_SECRET = previousIdentitySecret;
  }
});

describe("linkDevice rate limiting", () => {
  it("keys code-specific attempts with the identity-code HMAC secret", async () => {
    const code = "DH-AAAA-BBBB";

    await linkDevice.run({
      auth: { uid: "device-1" },
      data: { code, deviceName: "Phone" },
    });

    expect(protectedCallableMock).toHaveBeenCalledTimes(1);
    const options = protectedCallableMock.mock.calls[0]?.[0] as ProtectedCallableOptions;
    const codeLimit = options.rateLimits.find(({ key }) => key.startsWith("link-device:code:"));

    expect(codeLimit).toEqual({
      key: `link-device:code:${hashRecoveryCode(code, identitySecret)}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    expect(codeLimit?.key).not.toBe(`link-device:code:${hashForKey(code)}`);
    expect(codeLimit?.key).not.toContain(code);
  });
});
