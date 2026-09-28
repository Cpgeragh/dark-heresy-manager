# Save latency and synchronization contract

Repository paths in this document refer to the checked-out commit.

## Persistence paths

| Mutation type                                          | Client behaviour                                                                                   | Backend boundary                                              |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Text draft                                             | Keep local input responsive; commit after 600 milliseconds of inactivity; flush on blur or unmount | Direct write or protected field patch, depending on the field |
| Numeric quantity delta                                 | Merge changes for 300 milliseconds under one character-field key                                   | Protected character patch                                     |
| Ownership, recovery, account, session XP, and deletion | Submit immediately after explicit confirmation                                                     | Protected callable operation                                  |
| Rule-permitted metadata                                | Submit through the owning service                                                                  | Direct Firestore write subject to rules                       |

The text delay is supplied to `useDebouncedDraft`; the numeric constant is `CHARACTER_NUMBER_COALESCE_MS` in `src/services/characterService.ts`. If either value changes, update focused tests and this contract together.

## Acknowledgement and synchronization

A resolved mutation promise means the write or callable was acknowledged. It does not prove that every active listener has delivered the new state. Performance instrumentation records mutation acknowledgement separately from listener snapshots.

The UI may show optimistic local state while a save is pending, but it must:

- keep the final edit when focus changes or the component unmounts;
- avoid an older acknowledgement replacing a newer draft;
- expose a failure without discarding unsaved user input;
- prevent concurrent coalescing across different characters or field paths; and
- reconcile with the authoritative listener result.

## Offline and error behaviour

Direct Firestore writes can use the SDK's local persistence behaviour and may remain pending until connectivity returns. Callable Functions are network requests; a failed callable is not queued by Firestore and requires an explicit retry.

Expected callable errors retain their Firebase error code. Unexpected server failures become `internal` with a generic message. UI code must not infer success from an optimistic render or retry a non-idempotent operation automatically.

## Measurement

Measure two intervals independently:

1. final user input to mutation acknowledgement; and
2. final user input to the first relevant authoritative listener snapshot.

Run online and offline-recovery cases with the local performance controls. Quantitative latency budgets and baselines are `Pending re-measurement`.

| Alternative                                   | Constraint                                                                    |
| --------------------------------------------- | ----------------------------------------------------------------------------- |
| Write on every keystroke                      | Rejected because it increases write volume and synchronization churn          |
| Save only with an explicit page button        | Rejected for ordinary inline edits because navigation could strand local work |
| Treat acknowledgement as full synchronization | Rejected because listener delivery is a separate asynchronous boundary        |
