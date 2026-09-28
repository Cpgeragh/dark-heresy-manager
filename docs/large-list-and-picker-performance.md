# Large-list and picker performance

Repository paths in this document refer to the checked-out commit.

## Interaction contract

Searchable pickers use the shared picker shell and domain-owned filtering. Search input is debounced by 300 milliseconds through the UI timing constant. Results must remain keyboard operable, retain accessible names, and show a useful empty state.

Firestore-backed lists use the bounded windows in `src/constants/firestoreLimits.ts`. Static reference pickers may exceed those query limits, but their rendering and filtering still require measurement with the largest shipped reference set.

## Rendering requirements

- Compute normalized search text once per source-data change, not once per row on every keystroke.
- Keep row props and keys stable across filtering.
- Avoid mounting hidden duplicate result trees for responsive layouts.
- Render lightweight summary rows; defer expensive details to the selected screen or modal.
- Split toast or status updates from the result tree so feedback does not force all rows to rerender.
- Preserve focus when results change and announce an empty result without moving focus unexpectedly.
- Add pagination before raising a Firestore live-query bound.

## Verification scenarios

| Fixture or data set          | Journey                               | Required observation                                            |
| ---------------------------- | ------------------------------------- | --------------------------------------------------------------- |
| `large-dm`                   | Search and clear campaign-owned lists | Input remains responsive and listener count is unchanged        |
| `large-character`            | Open and filter inventory pickers     | Only visible picker work commits; closing releases transient UI |
| Largest static reference set | Type a narrow and broad query         | Filtering result is correct and focus remains usable            |
| `long-thread`                | Request older messages                | One bounded page is added without creating a listener per page  |

Quantitative latency and row-count thresholds are `Pending re-measurement`.

## Virtualization decision

| Alternative            | Constraint                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| Paginate server data   | Preferred when the backing query can exceed its live window                                               |
| Virtualize client rows | Use after measurement proves rendering is the bottleneck and focus/variable-height behaviour is specified |
| Raise the query limit  | Rejected without a cost, rules, and UI review                                                             |
