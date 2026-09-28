# Character-sheet rendering contract

Repository paths in this document refer to the checked-out commit.

## Rendering boundaries

`src/pages/CharacterSheet.tsx` owns one responsive character-sheet tree. Desktop and mobile presentation must not mount duplicate copies of the same interactive sheet merely to hide one with CSS.

The initial route loads the sheet shell and current content. These substantial domains are lazy-loaded:

| Lazy domain | Owning module |
| --- | --- |
| Talents | `TalentsTab` |
| Weapons | `WeaponsTab` |
| Cybernetics | `CyberneticsTab` |
| Psychic powers | `PsychicTab` |
| Gear | `GearTab` |
| Archeotech | `ArcheotechTab` |

Prefetching may begin after the route is usable, but it must not block the initial sheet.

## State and derivation rules

- Keep canonical character data in the route owner and pass the smallest stable props needed by each tab.
- Memoize expensive filtering, grouping, and reference-data joins when their inputs are stable.
- Do not copy derived collections into state unless the user can edit that derived representation independently.
- Preserve stable keys for item rows; array position is not a valid identity for reorderable data.
- Keep persistence callbacks stable where row memoization depends on referential equality.
- Record instrumentation metadata only; never record character text or message contents.

## Acceptance signals

| Scenario                   | Required signal                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| Edit one characteristic    | Unrelated dense tabs and rows do not rerender solely because the handler identity changed |
| Change active tab          | Only the selected panel is interactive; focus and scroll behaviour remain correct         |
| Open a dense inventory tab | First use may load its chunk; later use must not refetch the module                       |
| Update one list entry      | Stable sibling rows avoid unnecessary commits                                             |
| Navigate away              | Character-owned listeners and transient work clean up                                     |

Timing values are `Pending re-measurement`. Use the `large-character` profile and the methodology in `docs/performance-testing.md` before making a quantitative claim.

## Design constraints

| Alternative                            | Constraint                                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Separate mobile and desktop trees      | Rejected because it duplicates subscriptions, state, and hidden interactive controls                   |
| Global character context for every tab | Rejected unless selector-level subscriptions prevent whole-sheet rerenders                             |
| Virtualize every list                  | Use only when measured row cost and list size justify focus, measurement, and accessibility complexity |
