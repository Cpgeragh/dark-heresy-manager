import { useEffect, useEffectEvent, useState } from "react";
import {
  onSnapshot,
  type DocumentData,
  type DocumentReference,
  type DocumentSnapshot,
  type Query,
  type QuerySnapshot,
  type SnapshotMetadata,
  type Unsubscribe,
} from "firebase/firestore";
import { beginPerformanceSubscription } from "../performance/performanceMetrics";

export interface FirestoreSubscriptionState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
}

type SnapshotSubscriber<T> = (
  onData: (data: T, metadata?: SnapshotMetadata) => void,
  onError: (error: Error) => void
) => Unsubscribe;

interface SubscriptionState<T, TSource> extends FirestoreSubscriptionState<T> {
  source: TSource | null;
}

function normaliseError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function useFirestoreSubscription<T>({
  subscriptionKey,
  createEmptyData,
  subscribe,
}: {
  subscriptionKey: string | null;
  createEmptyData: () => T;
  subscribe: SnapshotSubscriber<T>;
}): FirestoreSubscriptionState<T> {
  const getEmptyData = useEffectEvent(createEmptyData);
  const startSubscription = useEffectEvent(subscribe);

  const [state, setState] = useState<SubscriptionState<T, string>>(() => ({
    source: subscriptionKey,
    data: createEmptyData(),
    loading: subscriptionKey !== null,
    error: null,
  }));

  if (state.source !== subscriptionKey) {
    setState({
      source: subscriptionKey,
      data: createEmptyData(),
      loading: subscriptionKey !== null,
      error: null,
    });
  }

  useEffect(() => {
    if (subscriptionKey === null) return;

    let active = true;
    const performanceSubscription =
      import.meta.env.MODE === "performance" ? beginPerformanceSubscription(subscriptionKey) : null;

    let unsubscribe: Unsubscribe;
    try {
      unsubscribe = startSubscription(
        (data, metadata) => {
          if (!active) return;
          performanceSubscription?.snapshot(
            Array.isArray(data) ? data.length : data === null ? 0 : 1,
            metadata
          );
          setState({ source: subscriptionKey, data, loading: false, error: null });
        },
        (error) => {
          if (!active) return;
          performanceSubscription?.error();
          setState({
            source: subscriptionKey,
            data: getEmptyData(),
            loading: false,
            error: normaliseError(error),
          });
        }
      );
    } catch (error) {
      queueMicrotask(() => {
        if (!active) return;
        setState({
          source: subscriptionKey,
          data: getEmptyData(),
          loading: false,
          error: normaliseError(error),
        });
      });
      return () => {
        active = false;
        performanceSubscription?.stop();
      };
    }

    return () => {
      active = false;
      unsubscribe();
      performanceSubscription?.stop();
    };
  }, [subscriptionKey]);

  if (state.source !== subscriptionKey) {
    return {
      data: createEmptyData(),
      loading: subscriptionKey !== null,
      error: null,
    };
  }

  return { data: state.data, loading: state.loading, error: state.error };
}

/** Subscribes to one document, or returns the disabled state for a null reference. */
export function useDocumentSubscription<TDocument extends DocumentData, TResult>(
  reference: DocumentReference<TDocument> | null,
  mapSnapshot: (snapshot: DocumentSnapshot<TDocument>) => TResult | null
): FirestoreSubscriptionState<TResult | null> {
  return useFirestoreSubscription<TResult | null>({
    subscriptionKey: reference?.path ?? null,
    createEmptyData: () => null,
    subscribe: (onData, onError) =>
      onSnapshot(
        reference!,
        (snapshot) => onData(mapSnapshot(snapshot), snapshot.metadata),
        onError
      ),
  });
}

/**
 * Subscribes to a query, or returns the disabled state when the query or key is null.
 * The key must change whenever the query's effective constraints change.
 */
export function useQuerySubscription<TDocument extends DocumentData, TResult>(
  sourceQuery: Query<TDocument> | null,
  subscriptionKey: string | null,
  mapSnapshot: (snapshot: QuerySnapshot<TDocument>) => TResult[]
): FirestoreSubscriptionState<TResult[]> {
  const activeKey = sourceQuery === null ? null : subscriptionKey;

  return useFirestoreSubscription<TResult[]>({
    subscriptionKey: activeKey,
    createEmptyData: () => [],
    subscribe: (onData, onError) =>
      onSnapshot(
        sourceQuery!,
        (snapshot) => onData(mapSnapshot(snapshot), snapshot.metadata),
        onError
      ),
  });
}
