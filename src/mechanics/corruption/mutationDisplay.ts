import type { CorruptionMutationEntry } from "../../types/Character";
import { getMutationRef } from "./mutationsReference";

export function mutationDisplayName(mutation: CorruptionMutationEntry): string {
  return getMutationRef(mutation.referenceId)?.name ?? mutation.name ?? "";
}
