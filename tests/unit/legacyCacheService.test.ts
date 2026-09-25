// @vitest-environment jsdom
import { beforeEach, expect, it } from "vitest";
import {
  finishLegacySecretCacheClear,
  isLegacySecretCacheClearRequested,
  legacySecretCacheClearFailed,
  legacySecretCacheNeedsClearing,
} from "../../src/services/legacyCacheService";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

it("marks the old cache cleared only after a successful purge", () => {
  sessionStorage.setItem("dhm-clear-legacy-secret-cache", "1");
  expect(isLegacySecretCacheClearRequested()).toBe(true);
  finishLegacySecretCacheClear(false);
  expect(legacySecretCacheNeedsClearing()).toBe(true);
  expect(legacySecretCacheClearFailed()).toBe(true);
  expect(isLegacySecretCacheClearRequested()).toBe(false);

  finishLegacySecretCacheClear(true);
  expect(legacySecretCacheNeedsClearing()).toBe(false);
  expect(legacySecretCacheClearFailed()).toBe(false);
});
