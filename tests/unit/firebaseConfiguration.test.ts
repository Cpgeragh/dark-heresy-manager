import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Header = { key: string; value: string };
type FirebaseConfiguration = {
  firestore?: { rules?: string; indexes?: string };
  hosting?: {
    public?: string;
    predeploy?: string[];
    ignore?: string[];
    rewrites?: Array<{ source: string; destination: string }>;
    headers?: Array<{ source: string; headers: Header[] }>;
  };
};

type FirestoreIndexes = {
  fieldOverrides?: Array<{
    collectionGroup: string;
    fieldPath: string;
    indexes: Array<{ order?: string; arrayConfig?: string; queryScope: string }>;
  }>;
};

const configuration = JSON.parse(
  readFileSync(resolve(process.cwd(), "firebase.json"), "utf8")
) as FirebaseConfiguration;
const firestoreIndexes = JSON.parse(
  readFileSync(resolve(process.cwd(), "firestore.indexes.json"), "utf8")
) as FirestoreIndexes;

function headersFor(source: string): Map<string, string> {
  return new Map<string, string>(
    configuration.hosting?.headers
      ?.find((entry) => entry.source === source)
      ?.headers.map((header) => [header.key, header.value] as const) ?? []
  );
}

function contentSecurityPolicy(): Map<string, string[]> {
  return new Map<string, string[]>(
    (headersFor("**").get("Content-Security-Policy") ?? "")
      .split(";")
      .map((directive) => directive.trim().split(/\s+/u))
      .filter(([name]) => name)
      .map(([name, ...values]) => [name, values] as const)
  );
}

describe("Firebase configuration", () => {
  it("deploys the reviewed Firestore rules and index definitions together", () => {
    expect(configuration.firestore).toEqual({
      rules: "firestore.rules",
      indexes: "firestore.indexes.json",
    });
  });

  it("indexes character ownership for both campaign and collection-group queries", () => {
    const ownerIndex = firestoreIndexes.fieldOverrides?.find(
      (entry) => entry.collectionGroup === "characters" && entry.fieldPath === "userId"
    );

    expect(ownerIndex?.indexes).toEqual(
      expect.arrayContaining([
        { order: "ASCENDING", queryScope: "COLLECTION" },
        { order: "ASCENDING", queryScope: "COLLECTION_GROUP" },
      ])
    );
  });

  it("applies the required security headers to every hosted response", () => {
    const headersByName = headersFor("**");

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

  it("keeps Firebase browser connections and PWA resources compatible with the CSP", () => {
    const policy = contentSecurityPolicy();

    expect(policy.get("script-src")).toEqual([
      "'self'",
      "https://apis.google.com",
      "https://www.google.com/recaptcha/",
      "https://www.gstatic.com/recaptcha/",
    ]);
    expect(policy.get("script-src")).not.toContain("'unsafe-eval'");
    expect(policy.get("connect-src")).toEqual(
      expect.arrayContaining([
        "'self'",
        "https://*.googleapis.com",
        "https://*.firebaseio.com",
        "wss://*.firebaseio.com",
        "https://*.firebaseapp.com",
        "https://*.cloudfunctions.net",
        "https://www.google.com/recaptcha/",
      ])
    );
    expect(policy.get("frame-src")).toEqual(
      expect.arrayContaining([
        "'self'",
        "https://*.firebaseapp.com",
        "https://www.google.com/recaptcha/",
        "https://recaptcha.google.com/recaptcha/",
      ])
    );
    expect(policy.get("img-src")).toEqual(expect.arrayContaining(["'self'", "data:", "blob:"]));
    expect(policy.get("worker-src")).toEqual(expect.arrayContaining(["'self'", "blob:"]));
    expect(policy.get("object-src")).toEqual(["'none'"]);
    expect(policy.get("frame-ancestors")).toEqual(["'none'"]);
  });

  it("builds before hosting, preserves SPA routes, and applies safe PWA caching", () => {
    expect(configuration.hosting?.public).toBe("dist");
    expect(configuration.hosting?.predeploy).toContain("node scripts/buildForDeploy.mjs");
    expect(configuration.hosting?.rewrites).toContainEqual({
      source: "**",
      destination: "/index.html",
    });
    expect(headersFor("/index.html").get("Cache-Control")).toContain("no-cache");
    for (const route of ["/", "/dm", "/player", "/select", "/settings", "/campaign/**"]) {
      expect(headersFor(route).get("Cache-Control"), route).toBe(
        "no-cache, no-store, must-revalidate"
      );
    }
    expect(headersFor("/sw.js").get("Cache-Control")).toContain("no-cache");
    expect(headersFor("/registerSW.js").get("Cache-Control")).toContain("no-cache");
    expect(headersFor("/manifest.webmanifest").get("Cache-Control")).toBe("no-cache");
    expect(headersFor("/assets/**").get("Cache-Control")).toBe(
      "public, max-age=31536000, immutable"
    );
  });
});
