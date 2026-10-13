// src/hooks/useHasBeenVisible.ts

import { useEffect, useRef, useState } from "react";

interface VisibilityOptions {
  root?: Element | null;
  rootMargin?: string;
}

export function useHasBeenVisible<T extends Element>({
  root = null,
  rootMargin,
}: VisibilityOptions = {}) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    const element = ref.current;
    if (visible || !element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { root, rootMargin }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [visible, root, rootMargin]);

  return { ref, visible };
}
