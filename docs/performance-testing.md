# Local performance test harness

Repository paths in this document refer to the checked-out commit.

The performance harness is a disposable local environment connected only to Firebase emulators. It provides deterministic data profiles and metadata-only instrumentation; it does not establish production performance by itself.

## Safety boundary

Performance mode requires Vite mode `performance` and Firebase project ID `dh-test`. The browser connects to fixed loopback endpoints:

| Service                 | Host        | Port |
| ----------------------- | ----------- | ---: |
| Authentication emulator | `127.0.0.1` | 9099 |
| Firestore emulator      | `127.0.0.1` | 8080 |
| Functions emulator      | `127.0.0.1` | 5001 |
| Vite preview            | `127.0.0.1` | 4175 |

The fixture seeder refuses conflicting environment values. Its reset operation targets only the running `dh-test` Firestore emulator.

## Start and seed

Start the emulators and application from the repository root:

```bash
npm run performance:local
```

Open `http://127.0.0.1:4175` once so the Auth emulator creates an anonymous user. In a second terminal, load one profile:

```bash
npm run performance:seed -- --profile empty
npm run performance:seed -- --profile small
npm run performance:seed -- --profile large-character
npm run performance:seed -- --profile large-dm
npm run performance:seed -- --profile long-thread
```

Reload the route printed by the seeder.

| Profile           | Intended scenario                                                |
| ----------------- | ---------------------------------------------------------------- |
| `new-account`     | Authenticated user without application records                   |
| `empty`           | Completed account without campaigns                              |
| `small`           | Ordinary mixed DM and player data                                |
| `large-character` | Dense character-sheet collections and long notes                 |
| `large-dm`        | Campaign, roster, session, custom-item, and inbox query pressure |
| `long-thread`     | Current message window plus older pages                          |

Fixture sizes are defined by `scripts/seedPerformanceFixtures.mjs`; do not duplicate their numeric contents here.

## Instrumentation contract

Performance mode exposes `window.__DHM_PERFORMANCE__`. Its snapshot contains metadata only:

- React commit durations;
- listener start, snapshot, and stop events with result counts;
- current active-listener count;
- named journey marks;
- mutation acknowledgement durations and sanitized error codes; and
- JavaScript heap size when the browser exposes it.

Call `reset()` immediately before one journey and use `mark(name)` for deterministic boundaries. Mutation completion measures promise settlement, not the later listener update; correlate it with the next relevant listener snapshot for end-to-end synchronization.

Automation in an isolated page context can dispatch `dhm-performance-snapshot-request` and read `data-dhm-performance-snapshot` from the root element. Reset and named-mark events are `dhm-performance-reset` and `dhm-performance-mark`. The transparent `#dhm-performance-snapshot` control provides the same snapshot when direct event dispatch is unavailable.

## Offline controls

Performance builds expose two transparent controls:

| Control                              | Result                                                               |
| ------------------------------------ | -------------------------------------------------------------------- |
| `#dhm-performance-firestore-disable` | Awaits Firestore network disablement and records the disabled marker |
| `#dhm-performance-firestore-enable`  | Awaits Firestore network enablement and records the enabled marker   |

These controls affect direct Firestore operations. Callable Functions are not queued by the Firestore offline cache and require an explicit retry after failure.

## Measurement method

Use one recorded test environment for each comparison and warm lazy modules before repeated measurements. The baseline record must contain:

- browser version and hardware;
- machine power profile and network state;
- fixture, route, and exact journey;
- build commit and build mode; and
- median and high-percentile values from multiple successful runs.

Exclude emulator startup, fixture seeding, browser-control latency, file chooser interaction, service-worker build time, and test-runner contention. Mark discarded runs instead of combining them with successful samples.

A memory leak requires repeatable post-warm-up growth plus a retained owner or structural signal. A single heap peak is insufficient.
