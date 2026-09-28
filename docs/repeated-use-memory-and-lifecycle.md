# Repeated-use memory and lifecycle contract

## Cleanup ownership

| Resource                      | Owner                                | Required cleanup                                                                   |
| ----------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------- |
| Firestore listener            | Subscription hook or global provider | Unsubscribe when its enabled source changes or owner unmounts                      |
| Timer                         | Hook or component that scheduled it  | Clear on replacement and unmount unless the callback is an intentional final flush |
| DOM or browser event listener | Module that registered it            | Remove the same listener with matching options                                     |
| Object URL                    | Image or file-preview owner          | Revoke after replacement or unmount                                                |
| In-flight async result        | Request owner                        | Ignore stale completion after source change or unmount                             |
| Modal or drawer side effect   | Surface owner                        | Restore scroll, focus, and transient state on close                                |

Global campaign listeners and reusable module or Firestore caches may remain after a route closes. Their continued presence is not a leak when ownership is intentional and bounded.

## Repeated-use scenarios

Warm each scenario once, reset instrumentation, and then repeat open-close or navigate-return cycles:

- Dashboard to campaign and back;
- campaign to character and back;
- message drawer open, page, and close;
- searchable picker open, filter, select or cancel;
- portrait chooser open and cancel;
- Settings open and close; and
- dense character tabs visited in alternating order.

After each cycle, record active listener identities, DOM node count, pending visible work, and heap size when available. Compare settled post-cleanup states, not peak active states.

## Diagnosis standard

A memory or lifecycle defect requires repeatable post-warm-up growth and an identified owner or structural symptom.

| Acceptable retained state | Boundary |
| --- | --- |
| Loaded JavaScript modules | One loaded instance per module graph |
| Canonical reference data | Bounded by the shipped data set |
| Decoded reusable assets | Browser-managed and stable after warm-up |
| Firestore caches | Bounded by configured cache behaviour |
| Global provider state | Owned for the authenticated application lifetime |

Quantitative heap and DOM baselines are `Pending re-measurement`. Do not use a single heap sample as proof of a leak.

## Regression coverage

Prefer focused lifecycle tests for deterministic cleanup:

- unsubscribe and timer cancellation;
- stale-result rejection;
- scroll and focus restoration; and
- object-URL revocation.

Use browser measurement for retained-memory questions that unit tests cannot represent.
