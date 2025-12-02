
import { useRef, useCallback } from 'react';

/**
 * Hook to prevent rapid navigation that can cause crashes
 */
export function useThrottledNavigation(delay: number = 300) {
  const lastNavigationRef = useRef(0);
  const isNavigatingRef = useRef(false);

  const throttledNavigate = useCallback((navigateFunction: () => void) => {
    const now = Date.now();
    const timeSinceLastNav = now - lastNavigationRef.current;

    // Prevent navigation if already navigating or too soon
    if (isNavigatingRef.current || timeSinceLastNav < delay) {
      console.log('Navigation throttled - too fast');
      return;
    }

    isNavigatingRef.current = true;
    lastNavigationRef.current = now;

    try {
      navigateFunction();
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      // Reset navigation flag after delay
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, delay);
    }
  }, [delay]);

  return throttledNavigate;
}

/**
 * Debounce rapid button presses
 */
export function useDebouncedPress(callback: () => void, delay: number = 300) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPressRef = useRef(0);

  const debouncedPress = useCallback(() => {
    const now = Date.now();
    const timeSinceLastPress = now - lastPressRef.current;

    // Ignore if pressed too recently
    if (timeSinceLastPress < delay) {
      console.log('Press ignored - too fast');
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    lastPressRef.current = now;
    
    timeoutRef.current = setTimeout(() => {
      callback();
    }, 50); // Small delay to prevent double-tap issues
  }, [callback, delay]);

  return debouncedPress;
}
