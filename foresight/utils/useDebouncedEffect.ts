import { useEffect, useRef } from 'react';

/**
 * Debounced version of useEffect
 * Delays execution until no new calls for the specified delay
 */
export const useDebouncedEffect = (
  effect: () => void,
  deps: any[],
  delay: number = 1000
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    // Run effect immediately on first mount
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      effect();
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
};
