# Release performance verification

Repository paths in this document refer to the checked-out commit.

Release performance sign-off requires a valid build, complete automated checks, and comparable measurements.

## Automated prerequisites

Run from the repository root:

```bash
npm run check:safety
npm run build
npm run check:build-inventory
npm run test:all
```

Any failure blocks performance sign-off because a comparison against an invalid build or incomplete behaviour is not meaningful.

## Measurement matrix

| Area                       | Fixture                  | Evidence                                               | Current status         |
| -------------------------- | ------------------------ | ------------------------------------------------------ | ---------------------- |
| Startup                    | `empty` and `small`      | Startup marks, route usability, entry requests         | Pending re-measurement |
| PWA update                 | Controlled PWA revisions | State marks, reload count, fallback behaviour          | Pending re-measurement |
| Character rendering        | `large-character`        | React commits and interaction latency                  | Pending re-measurement |
| Campaign lists and pickers | `large-dm`               | Input latency, commits, and listener stability         | Pending re-measurement |
| Message paging             | `long-thread`            | Page latency and listener/read behaviour               | Pending re-measurement |
| Text and numeric saves     | `large-character`        | Acknowledgement and listener-synchronization intervals | Pending re-measurement |
| Repeated use               | Relevant warmed fixtures | Post-cleanup listeners, DOM, and heap trend            | Pending re-measurement |
| JavaScript delivery        | Production build         | Build inventory and comparable size report             | Pending re-measurement |
| Test execution             | Full automated suite     | Per-layer duration and runner details                  | Pending re-measurement |

## Sign-off requirements

Performance sign-off requires:

- the checked-out commit and production build identity;
- browser, operating system, hardware, and power profile;
- fixture and exact journey for each result;
- warm-up policy, sample count, median, and high percentile;
- explicit discarded samples and variance notes;
- comparison with an approved baseline or a documented first-baseline decision;
- no sustained listener, DOM, or heap growth after warm-up; and
- named owner and follow-up for every accepted regression.

Use `docs/performance-testing.md` for harness operation. Use the component-specific performance documents for invariants; do not reproduce their contents in the release record.

## Decision outcomes

| Outcome          | Meaning                                                                               |
| ---------------- | ------------------------------------------------------------------------------------- |
| Pass             | Automated prerequisites pass and measured journeys meet approved budgets              |
| Conditional pass | A measured regression has explicit product acceptance, owner, expiry, and user impact |
| Fail             | A prerequisite fails, evidence is missing, or a regression lacks acceptance           |

Until approved budgets and new comparable samples exist, the release performance status is `Pending re-measurement`.
