const inFlightOperations = new Map<string, Promise<unknown>>();

function operationKey(scope: string, identity: readonly unknown[]): string {
  return JSON.stringify([scope, ...identity]);
}

/**
 * Reuses the first promise for an identical client operation until it settles.
 * This closes the same-tick gap before React busy state can re-render, but it is
 * deliberately only a client-side cost and usability boundary. Server-side
 * idempotency is still required for retries from other tabs, devices or clients.
 */
export function runSingleFlight<T>(
  scope: string,
  identity: readonly unknown[],
  operation: () => Promise<T>
): Promise<T> {
  const key = operationKey(scope, identity);
  const existing = inFlightOperations.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = Promise.resolve().then(operation);
  inFlightOperations.set(key, promise);

  void promise.then(
    () => {
      if (inFlightOperations.get(key) === promise) inFlightOperations.delete(key);
    },
    () => {
      if (inFlightOperations.get(key) === promise) inFlightOperations.delete(key);
    }
  );

  return promise;
}
