import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";
import type { RecoveryLookupResult } from "../types/Recovery";
import { assertRecoveryCode } from "../firestore/firebaseValidation";
import { recordClientCodeAttempt } from "../utils/clientCodeAttemptLimit";

export type RecoveryLookupOutcome =
  | { status: "found"; result: RecoveryLookupResult }
  | { status: "not-found" }
  | { status: "missing-data" };

type LookupRecoveryCodeResponse =
  | { status: "found"; preview: RecoveryLookupResult }
  | { status: "not-found" }
  | { status: "missing-data" };

const callLookupRecoveryCode = httpsCallable<{ code: string }, LookupRecoveryCodeResponse>(
  functions,
  "lookupRecoveryCode"
);

/** Resolves a Recovery Code to a minimal claim preview via the protected server-side operation. */
export async function lookupRecoveryCharacter(code: string): Promise<RecoveryLookupOutcome> {
  assertRecoveryCode(code);
  const normalisedCode = code.trim();
  recordClientCodeAttempt("recovery");
  const { data } = await callLookupRecoveryCode({ code: normalisedCode });
  if (data.status === "found") return { status: "found", result: data.preview };
  return { status: data.status };
}
