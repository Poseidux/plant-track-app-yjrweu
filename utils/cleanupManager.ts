
import { useEffect, useRef } from 'react';

/**
 * Centralized cleanup manager for preventing memory leaks
 */

export class CleanupManager {
  private cleanupFunctions: Set<() => void> = new Set();
  private timers: Set<NodeJS.Timeout> = new Set();
  private intervals: Set<NodeJS.Timeout> = new Set();

  /**
   * Register a cleanup function
   */
  register(cleanupFn: () => void): void {
    this.cleanupFunctions.add(cleanupFn);
  }

  /**
   * Register a timer for automatic cleanup
   */
  registerTimer(timer: NodeJS.Timeout): void {
    this.timers.add(timer);
  }

  /**
   * Register an interval for automatic cleanup
   */
  registerInterval(interval: NodeJS.Timeout): void {
    this.intervals.add(interval);
  }

  /**
   * Execute all cleanup functions
   */
  cleanup(): void {
    console.log(`Cleaning up ${this.cleanupFunctions.size} functions, ${this.timers.size} timers, ${this.intervals.size} intervals`);

    // Clear all timers
    this.timers.forEach(timer => {
      try {
        clearTimeout(timer);
      } catch (error) {
        console.error('Error clearing timer:', error);
      }
    });
    this.timers.clear();

    // Clear all intervals
    this.intervals.forEach(interval => {
      try {
        clearInterval(interval);
      } catch (error) {
        console.error('Error clearing interval:', error);
      }
    });
    this.intervals.clear();

    // Execute cleanup functions
    this.cleanupFunctions.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.error('Error in cleanup function:', error);
      }
    });
    this.cleanupFunctions.clear();
  }

  /**
   * Get cleanup stats
   */
  getStats(): { functions: number; timers: number; intervals: number } {
    return {
      functions: this.cleanupFunctions.size,
      timers: this.timers.size,
      intervals: this.intervals.size,
    };
  }
}

/**
 * Hook to use cleanup manager in components
 */
export function useCleanupManager(): CleanupManager {
  const managerRef = useRef<CleanupManager>(new CleanupManager());

  useEffect(() => {
    const manager = managerRef.current;
    
    return () => {
      manager.cleanup();
    };
  }, []);

  return managerRef.current;
}

export default CleanupManager;
