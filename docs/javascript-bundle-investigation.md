# JavaScript delivery boundaries

Repository paths in this document refer to the checked-out commit.

## Route and feature splitting

`src/App.tsx` lazy-loads the Dashboard, Campaign Overview, Character Sheet, and Onboarding routes. The application shell and Settings remain in the entry graph because they coordinate global startup and account state.

`src/pages/CharacterSheet.tsx` separately lazy-loads substantial feature tabs for talents, weapons, cybernetics, psychic powers, gear, and Archeotech. The sheet may prefetch selected heavy tabs after initial usability.

## Build acceptance

| Check                    | Required result                                                                                |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| Production build         | Completes without unresolved dynamic imports                                                   |
| PWA inventory            | Every required emitted asset is represented consistently in the generated service worker       |
| Performance marker check | Production service worker contains no performance-only revision marker                         |
| Route smoke test         | Direct navigation and fallback routing load each registered route                              |
| Offline revisit          | Previously cached application shell and visited route assets load under the defined PWA policy |

Run:

```bash
npm run build
npm run check:build-inventory
```

Current compressed and uncompressed size baselines are `Pending re-measurement`. Do not preserve asset counts or byte totals in this document; `scripts/checkBuiltPwaInventory.mjs` reports the current build inventory.

## Change rules

- Keep canonical reference data out of the entry graph when it is needed only by a lazy domain.
- Do not create tiny chunks that add request overhead without isolating meaningful work.
- Treat a new eager dependency in `src/main.tsx`, `src/App.tsx`, or a global provider as an entry-bundle decision.
- Compare equivalent production builds and record tool version, commit, and compression method.
- Verify that a split does not move required startup code behind a late failure boundary.

| Alternative                | Constraint                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------- |
| One application bundle     | Rejected because dense route and reference domains are not needed at startup          |
| Split every component      | Rejected because request and orchestration overhead can exceed the saved startup work |
| Rely on manual asset lists | Rejected because generated service-worker inventory is the enforceable source         |
