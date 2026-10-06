# Firestore subscription lifetime

Repository paths in this document refer to the checked-out commit.

## Ownership model

Subscriptions belong to the narrowest component or provider that needs their live result. `useDocumentSubscription` and `useQuerySubscription` own the complete listener lifecycle from start through cleanup.

`CampaignsProvider` is global in `src/App.tsx`. After authentication it keeps the active DM, active member and archived campaign queries alive across routes, including startup states, and `StartupGate` waits for all three before the application opens. Route pages add only the scoped listeners required by the mounted and enabled surface.

## Query windows

| Data                              | Maximum requested documents |
| --------------------------------- | --------------------------: |
| Active or archived campaign query |                         100 |
| Campaign character query          |                         100 |
| Owned-character collection group  |                       1,000 |
| Session query                     |                         200 |
| Thread summary query              |                         100 |
| Message page                      |                         100 |
| Claim-history page                |                          50 |
| Custom-item query                 |                         200 |

The source of truth is `src/constants/firestoreLimits.ts`. A screen that can outgrow a live window needs explicit pagination before its bound is increased.

## Lifecycle requirements

- A disabled query or missing identifier must create no listener and expose empty settled data.
- Changing a document path or query must unsubscribe the previous source before the replacement becomes authoritative.
- A callback from an obsolete source must not overwrite current state.
- Navigation away from a route must remove every route-owned listener.
- Closing a modal or drawer must remove listeners that exist only for that surface.
- Older message pages are explicit reads; they must not silently become permanent live listeners.
- Listener errors must settle loading state and surface an actionable UI state.

## Verification

Use the performance recorder's listener start, snapshot, stop, and active-count events. Reset after the route has warmed, perform one navigation or open-close cycle, and verify that the post-cleanup active set returns to the expected structural owners.

Exact listener counts are intentionally not documented because enabled queries depend on account role, route, and open surfaces. A release claim must include the fixture and active UI state. Current quantitative baseline: `Pending re-measurement`.
