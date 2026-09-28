# Performance budgets and baseline status

Repository paths in this document refer to the checked-out commit.

Performance claims must be tied to a build, fixture, browser, hardware profile, and measurement method. Historical values without that evidence are not release baselines.

## Current baseline status

| Journey               | Metric                                         | Budget              | Current baseline       |
| --------------------- | ---------------------------------------------- | ------------------- | ---------------------- |
| Authenticated startup | Time from navigation to usable dashboard       | Pending definition  | Pending re-measurement |
| Campaign navigation   | Time from action to usable campaign page       | Pending definition  | Pending re-measurement |
| Character navigation  | Time from action to usable initial tab         | Pending definition  | Pending re-measurement |
| Dense tab change      | Input-to-next-paint latency                    | Pending definition  | Pending re-measurement |
| Text save             | Edit to write acknowledgement                  | Pending definition  | Pending re-measurement |
| Text synchronization  | Edit to relevant listener snapshot             | Pending definition  | Pending re-measurement |
| Quantity change       | Final input to coalesced acknowledgement       | Pending definition  | Pending re-measurement |
| Large picker search   | Input-to-updated-results latency               | Pending definition  | Pending re-measurement |
| Repeated route use    | Post-cleanup listener and heap stability       | No sustained growth | Pending re-measurement |
| PWA update            | Update detection to settled user-visible state | Pending definition  | Pending re-measurement |

Do not replace `Pending re-measurement` with a single observed run. Establish a budget only after repeated measurements on the same reference environment and an explicit product decision.

## Required evidence

Each accepted baseline record must include:

- checked-out commit and production or performance build mode;
- browser and operating-system versions;
- CPU, memory, and power profile;
- fixture profile and exact user journey;
- sample count, warm-up policy, median, and high percentile;
- listener, mutation, and render evidence relevant to the journey; and
- identified variance or discarded samples.

The harness and exclusions are defined in `docs/performance-testing.md`. Component-specific invariants are defined in the other performance documents and should not be copied into a baseline record.
