"use client";

import { useEffect, useState } from "react";

export function usePromise<T>(
  promise: () => Promise<T>,
  deps: React.DependencyList = []
): T | null {
  const [value, setValue] = useState<T | null>(null);

  useEffect(() => {
    let isMounted = true;
    promise().then((v) => {
      if (isMounted) {
        setValue(v);
      }
    });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return value;
}
