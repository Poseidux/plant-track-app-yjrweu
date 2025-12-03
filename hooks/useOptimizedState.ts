
import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Optimized state hook that prevents updates after unmount
 */
export function useSafeState<T>(
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initialValue);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const setSafeState = useCallback((value: T | ((prev: T) => T)) => {
    if (isMountedRef.current) {
      setState(value);
    }
  }, []);

  return [state, setSafeState];
}

/**
 * Batched state updates to reduce re-renders
 */
export function useBatchedState<T>(
  initialValue: T,
  batchDelay: number = 16
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [state, setState] = useState<T>(initialValue);
  const pendingUpdateRef = useRef<T | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (pendingUpdateRef.current !== null) {
      setState(pendingUpdateRef.current);
      pendingUpdateRef.current = null;
    }
  }, []);

  const setBatchedState = useCallback((value: T | ((prev: T) => T)) => {
    const newValue = typeof value === 'function' 
      ? (value as (prev: T) => T)(pendingUpdateRef.current ?? state)
      : value;

    pendingUpdateRef.current = newValue;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(flush, batchDelay);
  }, [state, batchDelay, flush]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return [state, setBatchedState, flush];
}

/**
 * Debounced state updates
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300
): [T, T, (value: T) => void] {
  const [immediateValue, setImmediateValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const setValue = useCallback((value: T) => {
    setImmediateValue(value);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return [immediateValue, debouncedValue, setValue];
}

/**
 * Throttled state updates
 */
export function useThrottledState<T>(
  initialValue: T,
  limit: number = 300
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(initialValue);
  const lastUpdateRef = useRef<number>(0);
  const pendingUpdateRef = useRef<T | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const setThrottledState = useCallback((value: T) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    if (timeSinceLastUpdate >= limit) {
      setState(value);
      lastUpdateRef.current = now;
      pendingUpdateRef.current = null;
    } else {
      pendingUpdateRef.current = value;

      if (!timerRef.current) {
        timerRef.current = setTimeout(() => {
          if (pendingUpdateRef.current !== null) {
            setState(pendingUpdateRef.current);
            lastUpdateRef.current = Date.now();
            pendingUpdateRef.current = null;
          }
          timerRef.current = null;
        }, limit - timeSinceLastUpdate);
      }
    }
  }, [limit]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return [state, setThrottledState];
}
