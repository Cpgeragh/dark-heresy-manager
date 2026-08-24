// functions/src/shared/timingSafety.ts
//
// Stage 3: normalizes response latency for operations that resolve a
// caller-supplied secret (a Recovery Code) against an index, so an attacker
// can't distinguish "wrong code" from "right code" by how many Firestore
// round-trips the response took — a wrong code fails after one lookup, a
// right code triggers several more reads before responding, a gap large
// enough to actually observe over a network. Pads every response (success,
// failure, or thrown error) up to a fixed floor rather than trying to speed
// up or slow down one specific path, which would need constant
// recalibration as latencies drift.

export async function withMinimumDuration<T>(minMs: number, work: () => Promise<T>): Promise<T> {
  const start = Date.now();
  try {
    return await work();
  } finally {
    const elapsed = Date.now() - start;
    if (elapsed < minMs) {
      await new Promise((resolve) => setTimeout(resolve, minMs - elapsed));
    }
  }
}
