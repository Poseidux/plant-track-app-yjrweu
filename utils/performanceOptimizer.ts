
// Performance optimization utilities
import { useEffect, useRef } from 'react';

/**
 * Hook to debounce rapid function calls
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  };
}

/**
 * Hook to throttle rapid function calls
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastRunRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRunRef.current;

    if (timeSinceLastRun >= delay) {
      callbackRef.current(...args);
      lastRunRef.current = now;
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
        lastRunRef.current = Date.now();
      }, delay - timeSinceLastRun);
    }
  };
}

/**
 * Hook to track if component is mounted
 */
export function useIsMounted(): React.MutableRefObject<boolean> {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return isMountedRef;
}

/**
 * Cleanup utility for animations
 */
export function cleanupAnimation(animationRef: React.MutableRefObject<any>) {
  if (animationRef.current) {
    try {
      animationRef.current.stop();
      animationRef.current = null;
    } catch (error) {
      console.error('Error cleaning up animation:', error);
    }
  }
}

/**
 * Cleanup utility for timers
 */
export function cleanupTimer(timerRef: React.MutableRefObject<NodeJS.Timeout | null>) {
  if (timerRef.current) {
    try {
      clearTimeout(timerRef.current);
      clearInterval(timerRef.current);
      timerRef.current = null;
    } catch (error) {
      console.error('Error cleaning up timer:', error);
    }
  }
}
