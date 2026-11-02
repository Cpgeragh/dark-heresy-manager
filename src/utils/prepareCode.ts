/** Share foreground and background imports, allowing another attempt after a failure. */
export function cachedImport<T>(importModule: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | undefined;
  return () => {
    pending ??= importModule().catch((error: unknown) => {
      pending = undefined;
      throw error;
    });
    return pending;
  };
}

type Job = () => Promise<unknown>;
const queue = new Map<Job, Set<symbol>>();
let running = false;
let cancelIdle: (() => void) | undefined;

function scheduleNext() {
  if (running || cancelIdle || queue.size === 0) return;
  const run = () => {
    cancelIdle = undefined;
    const job = queue.keys().next().value;
    if (!job) return;
    queue.delete(job);
    running = true;
    // Background failure must not interrupt the visible screen.
    void Promise.resolve()
      .then(job)
      .catch(() => undefined)
      .finally(() => {
        running = false;
        scheduleNext();
      });
  };
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(run);
    cancelIdle = () => window.cancelIdleCallback(id);
  } else {
    const id = window.setTimeout(run, 200);
    cancelIdle = () => window.clearTimeout(id);
  }
}

/** Queue imports serially after readiness; cancellation only removes work not yet started. */
export function prepareCode(jobs: readonly Job[]): () => void {
  const owner = Symbol();
  for (const job of jobs) {
    const owners = queue.get(job) ?? new Set<symbol>();
    owners.add(owner);
    queue.set(job, owners);
  }
  scheduleNext();
  return () => {
    for (const [job, owners] of queue) {
      owners.delete(owner);
      if (owners.size === 0) queue.delete(job);
    }
    if (queue.size === 0) {
      cancelIdle?.();
      cancelIdle = undefined;
    }
  };
}
