# Local performance testing

The performance environment is a disposable local-only copy of the application. It connects the
browser to the Firebase Auth, Firestore and Functions emulators and never needs production data.

## Safety boundary

Performance mode starts only when Vite's mode is `performance` and the Firebase project ID is
exactly `dh-test`. The browser then connects to fixed services on `127.0.0.1`:

- Auth: `9099`
- Firestore: `8080`
- Functions: `5001`

The fixture seeder has the same fixed project and host restrictions. It refuses conflicting
environment values before importing Firebase Admin or deleting data. Its reset affects only the
running `dh-test` Firestore emulator.

## Starting the environment

Run `npm run performance:local`. This builds the local Functions code, starts the three Firebase
emulators, and serves the app at `http://127.0.0.1:4175` in performance mode. Open the app once so
Firebase Auth creates its normal anonymous emulator account.

In another terminal, select one fixture at a time:

```text
npm run performance:seed -- --profile empty
npm run performance:seed -- --profile small
npm run performance:seed -- --profile large-character
npm run performance:seed -- --profile large-dm
npm run performance:seed -- --profile long-thread
```

Reload the displayed route after seeding. `new-account` clears Firestore and deliberately leaves
the existing anonymous Auth account without application records, exercising first-run onboarding.

## Reproducible fixture definitions

| Profile           | Stored load                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| `new-account`     | No Firestore documents                                                                                         |
| `empty`           | Completed account and profile, no campaigns                                                                    |
| `small`           | One DM campaign, one joined campaign, four characters, eight sessions, twelve custom items and thirty messages |
| `large-character` | One character with 180-entry load-bearing collections, a 90-key map and 3,000-character notes                  |
| `large-dm`        | 45 campaigns; selected campaign has 90 characters, 180 sessions, 180 custom items and 90 thread summaries      |
| `long-thread`     | One campaign, one character and 300 messages, giving one live page and two older pages                         |

Dates, document IDs, names and values are deterministic. The only variable is the anonymous local
user ID to which the profile is attached.

## Measurement signals

Performance mode exposes `window.__DHM_PERFORMANCE__`. It contains bounded, metadata-only events;
no character or message content is recorded. `snapshot()` returns:

- React commit durations from the application profiler
- listener start, first/subsequent snapshot and stop events, including result counts
- active listener count
- custom journey marks that can bracket a mutation and its following listener snapshot
- JavaScript heap size when the browser exposes it

Use `reset()` immediately before an individual journey and `mark(name)` for its deterministic start
and end signals. Timing thresholds are intentionally not asserted in the automated tests until a
stable baseline has been gathered on the same machine.

Browser automation that runs in an isolated page context can request the same data without direct
global access: dispatch `dhm-performance-snapshot-request`, then read the
`data-dhm-performance-snapshot` attribute on the root HTML element. Reset and named-mark requests
use `dhm-performance-reset` and `dhm-performance-mark`; the latter reads its name from
`data-dhm-performance-mark`.

Where custom event dispatch is unavailable, click the performance-only transparent button
`#dhm-performance-snapshot` and read the same root attribute. Snapshot serialisation still occurs
only on request. Native modal dialogs occupy the browser top layer and block controls behind them;
reset before opening such a dialog and request its snapshot after closing it.

Mutation services also emit paired metadata-only events:

- `mutation-start` records the operation name, a monotonically increasing `mutationId`, and the
  start time.
- `mutation-complete` records the matching ID and acknowledgement duration.
- `mutation-error` records the matching ID, acknowledgement duration, and a sanitised Firebase
  error code when one is available.

The duration ends when the write, batch, transaction, or callable promise settles. It is therefore
write-acknowledgement latency, not listener turnaround. To measure end-to-end synchronisation,
reset immediately before the action and correlate the mutation's completion with the relevant
subsequent listener snapshot. Payloads, field values, message text, and raw error messages are
never recorded.

Performance mode provides two additional transparent controls for deterministic offline tests:

- `#dhm-performance-firestore-disable` awaits `disableNetwork(db)` and sets
  `data-dhm-performance-firestore-network="disabled"` on the root element.
- `#dhm-performance-firestore-enable` awaits `enableNetwork(db)` and sets the same attribute to
  `"enabled"`.

Both controls add a matching `firestore-network:*` mark after the transition completes. They
affect direct Firestore operations only. Callable Functions are not queued by Firestore's offline
cache; a callable mutation that reports a failure still requires an explicit retry. These controls
exist only in the guarded local performance build.

## Repeated-use lifecycle measurements

Use repeated cycles when investigating performance that may degrade during a long application
session. Warm the route or interface once before recording cycles when it loads a lazy module,
reference data, images, or a substantial Firestore result for the first time.

For every measured cycle:

1. Record the settled baseline before the action.
2. Open the drawer, modal, picker, or route and record its active state where possible.
3. Close it or navigate away, wait for the deterministic settled signal, and record the new
   baseline.
4. Compare total DOM nodes, active Firestore listeners, and heap size when exposed.
5. Repeat enough later cycles to determine whether post-cleanup values stabilise, fall, or continue
   to grow.

Event-handler and timer counts are not exposed by the performance recorder. Check their ownership
through source pairing and focused lifecycle tests unless a guarded measurement-only instrument is
separately justified. Do not monkey-patch browser globals during an ordinary performance run; the
instrumentation can change the lifecycle being measured.

Do not diagnose a leak from a single high heap value or from memory that remains allocated after
the first use. Lazy modules, decoded assets, reference data, Firestore caches, and browser-managed
rendering structures can remain allocated for reuse. Require repeatable upward growth after warm-up
and corroborate it with a structural signal or an identified retained owner before proposing a
cleanup correction.

Exclude emulator startup, fixture seeding, browser-control delays, file-chooser interaction,
service-worker build or installation time, and test-runner contention from product lifecycle
conclusions. Record discarded or incomplete cycles rather than combining them with successful
measurements.
