# Dependency security assessment

Last reviewed: 28 September 2026.

Repository paths in this document refer to the checked-out commit.

## Runtime audit snapshot

Run `npm audit --omit=dev` in each package root before release and after dependency changes.

| Package root     | Moderate | High | Critical | Assessment                                           |
| ---------------- | -------: | ---: | -------: | ---------------------------------------------------- |
| Repository root  |        0 |    0 |        0 | No known runtime advisory in the installed lockfile  |
| `functions/`     |       10 |    0 |        0 | Accepted transitive Google SDK chain described below |
| `billing-guard/` |       10 |    0 |        0 | Accepted transitive Google SDK chain described below |

The totals are a dated lockfile snapshot. Re-run the commands rather than copying them into release evidence.

```bash
npm audit --omit=dev
npm --prefix functions audit --omit=dev
npm --prefix billing-guard audit --omit=dev
```

## Accepted transitive advisory

The server-package findings are package-level effects of the same `uuid` advisory.

| Dependency edge                              | Why it is present                                      |
| -------------------------------------------- | ------------------------------------------------------ |
| `firebase-functions` to `firebase-admin`     | Supported Firebase Functions peer/runtime relationship |
| `firebase-admin` to `@google-cloud/storage`  | Firebase Admin transitive dependency                   |
| `@google-cloud/storage` to request libraries | Google Cloud transport implementation                  |
| Request libraries to `uuid`                  | Transitive identifier utility                          |

The current risk is accepted because project code does not import the affected `uuid` API, `billing-guard/` does not use Firebase Admin Storage, and npm reports no compatible automatic fix for the top-level supported packages. Forced downgrades or unsupported transitive overrides are not an acceptable remediation.

Acceptance must be reassessed when:

- Firebase Functions or Firebase Admin publishes a compatible dependency update;
- either deployed package begins using Cloud Storage;
- the advisory's affected API or exploit conditions change; or
- a release audit reports a high or critical runtime finding.

## Development dependencies

Development-only findings do not ship in the browser bundle or deployed application code, but local tooling still processes repository input and credentials. Run a full `npm audit` when changing build, emulator, test, or deployment tooling. Do not suppress findings solely because they are development dependencies.

Release decisions must record the advisory, affected path, reachable project behaviour, available supported fix, and owner. A numeric audit total without that mapping is insufficient.
