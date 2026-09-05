# Dependency security assessment

Last reviewed: 5 September 2026.

## Runtime audit status

Run `npm audit --omit=dev` from each package root before release and after dependency changes.

| Package root | Runtime findings | Assessment |
| --- | ---: | --- |
| Root application | 0 | No known runtime advisories. |
| `functions/` | 7 moderate | Accepted transitive findings described below. |
| `billing-guard/` | 7 moderate | Accepted transitive findings described below. |

The Functions package uses `firebase-admin` 14.3.0 and `firebase-functions` 7.3.2. Updating Firebase Admin removed the actionable Firestore dependency findings, while updating `qs` to 6.16.0 removed the Express query-parser findings.

## Accepted Google SDK dependency chain

The remaining audit entries in both server packages are the inherited package-level effects of one `uuid` advisory:

`firebase-functions` -> `firebase-admin` -> `@google-cloud/storage` -> `retry-request` / `teeny-request` / `gaxios` -> `uuid`

They are currently accepted for these reasons:

- Neither server package imports Firebase Admin Storage or `@google-cloud/storage`.
- `billing-guard/` does not import Firebase Admin at all. Firebase Functions installs it as a peer dependency.
- The advisory affects UUID v3, v5 and v6 calls that receive a caller-provided output buffer. The installed `gaxios` and `teeny-request` implementations call only `uuid.v4()`, and project code does not import `uuid`.
- The latest compatible Firebase SDKs still install the affected Cloud Storage chain.
- npm's proposed automatic fix downgrades Firebase Admin or Firebase Functions to old major versions. Forcing major transitive overrides would create an unsupported dependency combination.

These findings must be reassessed when Google publishes a compatible dependency update, if either project begins using Cloud Storage, if the Google libraries change how they call `uuid`, or if the advisory's affected conditions change.
