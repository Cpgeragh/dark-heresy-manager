# Save latency and synchronization contract

Repository paths in this document refer to the checked-out commit.

## Persistence paths

| Mutation type                                          | Client behaviour                                                                                   | Backend boundary                                              |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Text draft                                             | Keep local input responsive; commit after 600 milliseconds of inactivity; flush on blur or unmount | Direct write or protected field patch, depending on the field |
| Numeric quantity delta                                 | Merge changes for 300 milliseconds under one character-field key                                   | Protected character patch                                     |
| Stepper counter block                                  | Show each change at once; send the latest block 300 milliseconds after the last change             | Protected character patch                                     |
| Ownership, recovery, account, session XP, and deletion | Submit immediately after explicit confirmation                                                     | Protected callable operation                                  |
| Rule-permitted metadata                                | Submit through the owning service                                                                  | Direct Firestore write subject to rules                       |

The text delay is supplied to `useDebouncedDraft`; the numeric constant is `CHARACTER_NUMBER_COALESCE_MS` in `src/constants/saveTiming.ts`. If either value changes, update focused tests and this contract together.

## Instant character edits

`useCharacterMutations` accepts `{ optimistic: true }` on a field or collection save. `useOptimisticOverlay` then shows the new value at once, drops it when the authoritative listener catches up, and removes it with an error message when the save fails.

| Owner                                                    | Behaviour                                                                                                                                                                |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `useCharacterMutations` with `coalesceMs`                | Applies each counter change to the overlay, keeps one pending save per field, and sends the latest value once the interval ends                                          |
| `useCharacterMutations` ordinary save for the same field | Cancels the pending counter save and sends at once, because the newer value already includes the earlier counter changes                                                 |
| `useCharacterMutations` unmount                          | Sends every pending counter save at once                                                                                                                                 |
| `COUNTER_PATCH_OPTIONS` in `useOptimisticOverlay.ts`     | The shared options for Stepper counters: Current Wounds, Critical Damage, Fatigue, Current Fate, Corruption points and Insanity points                                   |
| `patchCharacterCollectionField` in `characterService.ts` | Sends any pending numeric quantity delta for the same character and field before an instant whole-list save, so the delta cannot apply on top of a list that includes it |

Quantities, spare cells and the clip, round and magazine round counters save as numeric deltas, so their saves are order independent. Counters that save a whole block use the pause above, because whole-block saves are not order independent.

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
