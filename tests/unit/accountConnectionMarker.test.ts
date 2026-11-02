// @vitest-environment jsdom
import { beforeEach, expect, it } from "vitest";
import {
  readAccountConnection,
  rememberAccountConnection,
  forgetAccountConnection,
} from "../../src/services/accountConnectionMarker";
beforeEach(() => localStorage.clear());
it("retains the old connection when a different fresh login has no link", () => {
  rememberAccountConnection("old-login", "account");
  forgetAccountConnection("fresh-login");
  expect(readAccountConnection()).toEqual({ deviceUid: "old-login", accountId: "account" });
});
it("clears only the disconnected device marker", () => {
  rememberAccountConnection("device", "account");
  forgetAccountConnection("device");
  expect(readAccountConnection()).toBeNull();
});
it("replaces the marker when recovery completes on a new login", () => {
  rememberAccountConnection("old-login", "account");
  rememberAccountConnection("recovered-login", "account");
  forgetAccountConnection("old-login");
  expect(readAccountConnection()?.deviceUid).toBe("recovered-login");
});
