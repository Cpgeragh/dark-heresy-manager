import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Header = { key: string; value: string };
type FirebaseConfiguration = {
  firestore?: { rules?: string; indexes?: string };
  hosting?: { headers?: Array<{ source: string; headers: Header[] }> };
};

const configuration = JSON.parse(
  readFileSync(resolve(process.cwd(), "firebase.json"), "utf8")
) as FirebaseConfiguration;

describe("Firebase configuration", () => {
  it("deploys the reviewed Firestore rules and index definitions together", () => {
    expect(configuration.firestore).toEqual({
      rules: "firestore.rules",
      indexes: "firestore.indexes.json",
    });
  });

  it("applies the required security headers to every hosted response", () => {
    const globalHeaders = configuration.hosting?.headers?.find(
      (entry) => entry.source === "**"
    )?.headers;
    const headersByName = new Map(globalHeaders?.map((header) => [header.key, header.value]) ?? []);

    expect(headersByName.get("Content-Security-Policy")).toContain("default-src 'self'");
    expect(headersByName.get("Content-Security-Policy")).toContain("object-src 'none'");
    expect(headersByName.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(headersByName.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headersByName.get("X-Frame-Options")).toBe("DENY");
    expect(headersByName.get("Referrer-Policy")).toBe("no-referrer");
    expect(headersByName.get("Permissions-Policy")).toContain("camera=()");
    expect(headersByName.get("Cross-Origin-Opener-Policy")).toBe("same-origin");
    expect(headersByName.get("Cross-Origin-Resource-Policy")).toBe("same-origin");
  });
});
