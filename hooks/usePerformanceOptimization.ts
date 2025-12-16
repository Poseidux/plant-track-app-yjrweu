
import { useEffect, useRef, useCallback } from 'react';
import { InteractionManager } from 'react-native';

/**
 * Hook to defer heavy operations until after interactions complete
 */
export function useDeferredOperation<T extends (...args: any[]) => any>(
  operation: T
): (...args: Parameters<T>) => void {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback((...args: Parameters<T>) => {
    InteractionManager.runAfterInteractions(() => {
      if (isMountedRef.current) {
        operation(...args);
      }
    });
  }, [operation]);
}

/**
 * Hook to track component mount/unmount for cleanup
 */
export function useCleanup(cleanup: () => void): void {
  useEffect(() => {
    return () => {
      try {
        cleanup();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    };
  }, [cleanup]);
}

/**
 * Hook to prevent rapid re-execution of expensive operations
 */
export function useRateLimited<T extends (...args: any[]) => any>(
  operation: T,
  minInterval: number = 1000
): (...args: Parameters<T>) => void {
  const lastExecutionRef = useRef<number>(0);
  const pendingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pendingTimeoutRef.current) {
        clearTimeout(pendingTimeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecutionRef.current;

    if (timeSinceLastExecution >= minInterval) {
      operation(...args);
      lastExecutionRef.current = now;
    } else {
      if (pendingTimeoutRef.current) {
        clearTimeout(pendingTimeoutRef.current);
      }

      pendingTimeoutRef.current = setTimeout(() => {
        operation(...args);
        lastExecutionRef.current = Date.now();
        pendingTimeoutRef.current = null;
      }, minInterval - timeSinceLastExecution);
    }
  }, [operation, minInterval]);
}

/**
 * Hook to batch multiple state updates
 */
export function useBatchedUpdates(): (callback: () => void) => void {
  const batchRef = useRef<(() => void)[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return useCallback((callback: () => void) => {
    batchRef.current.push(callback);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      const batch = [...batchRef.current];
      batchRef.current = [];
      
      batch.forEach(cb => {
        try {
          cb();
        } catch (error) {
          console.error('Batched update error:', error);
        }
      });
    }, 16); // One frame
  }, []);
}

/**
 * Hook to prevent memory leaks from async operations
 */
export function useSafeAsync<T>(
  asyncOperation: () => Promise<T>,
  onSuccess?: (result: T) => void,
  onError?: (error: Error) => void
): () => void {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(() => {
    asyncOperation()
      .then(result => {
        if (isMountedRef.current && onSuccess) {
          onSuccess(result);
        }
      })
      .catch(error => {
        if (isMountedRef.current && onError) {
          onError(error);
        } else {
          console.error('Async operation error:', error);
        }
      });
  }, [asyncOperation, onSuccess, onError]);
}
