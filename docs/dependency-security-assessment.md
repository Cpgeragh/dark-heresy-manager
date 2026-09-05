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

## Development tooling audit

The root development tools were reviewed on 5 September 2026. Firebase Admin was updated to 14.3.0, Firebase CLI to 15.29.0, PostCSS to 8.5.28, Vite to 7.3.6 and esbuild to 0.28.2. Compatible transitive updates removed every low, high and critical development finding.

The full root audit retains 23 moderate package-level findings, while `npm audit --omit=dev` reports zero runtime findings. The remaining development-only paths come from:

- the Firebase Admin Cloud Storage chain assessed above; and
- dependencies bundled with the latest Firebase CLI, including its Cloud SQL connector, Pub/Sub telemetry, MCP and Exegesis HTTP tooling, JSON streaming, Express query parsing and Google authentication utilities.

These tools run only during local testing, emulation and deployment; none are shipped in the browser application or deployed as application runtime dependencies. The repository does not feed untrusted archives, project files, custom browser statistics, tracing baggage or query-parser input into these tools during its normal workflows. npm offers no supported compatible update for the remaining paths and its forced proposal would downgrade Firebase CLI to 10.1.1. That downgrade and unsupported transitive overrides are rejected.

The development findings must be reassessed when Firebase CLI or Firebase Admin publishes a compatible dependency update, whenever local tooling begins processing untrusted input, or before adopting a new emulator or deployment workflow.
