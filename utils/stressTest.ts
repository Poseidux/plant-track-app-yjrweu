
/**
 * Stress testing utilities to simulate heavy app usage
 * Use these to test app stability under extreme conditions
 */

import { Alert } from 'react-native';

export interface StressTestConfig {
  duration: number; // milliseconds
  actionsPerSecond: number;
  logResults: boolean;
}

export interface StressTestResult {
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  averageResponseTime: number;
  errors: { action: string; error: string; timestamp: number }[];
}

/**
 * Run a stress test with random actions
 */
export async function runStressTest(
  actions: { name: string; action: () => Promise<void> }[],
  config: StressTestConfig
): Promise<StressTestResult> {
  const result: StressTestResult = {
    totalActions: 0,
    successfulActions: 0,
    failedActions: 0,
    averageResponseTime: 0,
    errors: [],
  };

  const startTime = Date.now();
  const endTime = startTime + config.duration;
  const actionDelay = 1000 / config.actionsPerSecond;
  const responseTimes: number[] = [];

  console.log('🧪 Starting stress test...');
  console.log(`Duration: ${config.duration}ms`);
  console.log(`Actions per second: ${config.actionsPerSecond}`);

  while (Date.now() < endTime) {
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    const actionStartTime = Date.now();

    try {
      await randomAction.action();
      result.successfulActions++;
      
      const responseTime = Date.now() - actionStartTime;
      responseTimes.push(responseTime);
      
      if (config.logResults) {
        console.log(`✅ ${randomAction.name} completed in ${responseTime}ms`);
      }
    } catch (error) {
      result.failedActions++;
      result.errors.push({
        action: randomAction.name,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      });
      
      if (config.logResults) {
        console.error(`❌ ${randomAction.name} failed:`, error);
      }
    }

    result.totalActions++;

    // Wait before next action
    await new Promise(resolve => setTimeout(resolve, actionDelay));
  }

  // Calculate average response time
  if (responseTimes.length > 0) {
    result.averageResponseTime = 
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  }

  console.log('🧪 Stress test completed!');
  console.log(`Total actions: ${result.totalActions}`);
  console.log(`Successful: ${result.successfulActions}`);
  console.log(`Failed: ${result.failedActions}`);
  console.log(`Average response time: ${result.averageResponseTime.toFixed(2)}ms`);
  console.log(`Errors: ${result.errors.length}`);

  return result;
}

/**
 * Simulate rapid navigation between screens
 */
export async function stressTestNavigation(
  navigate: (route: string) => void,
  routes: string[],
  config: StressTestConfig
): Promise<StressTestResult> {
  const actions = routes.map(route => ({
    name: `Navigate to ${route}`,
    action: async () => {
      navigate(route);
      await new Promise(resolve => setTimeout(resolve, 50));
    },
  }));

  return runStressTest(actions, config);
}

/**
 * Simulate rapid button taps
 */
export async function stressTestButtonTaps(
  buttons: { name: string; onPress: () => void }[],
  config: StressTestConfig
): Promise<StressTestResult> {
  const actions = buttons.map(button => ({
    name: `Tap ${button.name}`,
    action: async () => {
      button.onPress();
      await new Promise(resolve => setTimeout(resolve, 10));
    },
  }));

  return runStressTest(actions, config);
}

/**
 * Simulate heavy data operations
 */
export async function stressTestDataOperations(
  operations: { name: string; operation: () => Promise<void> }[],
  config: StressTestConfig
): Promise<StressTestResult> {
  return runStressTest(operations, config);
}

/**
 * Memory leak detector
 */
export class MemoryLeakDetector {
  private snapshots: { timestamp: number; description: string }[] = [];
  private maxSnapshots: number = 10;

  takeSnapshot(description: string): void {
    this.snapshots.push({
      timestamp: Date.now(),
      description,
    });

    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    console.log(`📸 Memory snapshot: ${description}`);
  }

  getReport(): string {
    if (this.snapshots.length < 2) {
      return 'Not enough snapshots to generate report';
    }

    const report = [
      '=== Memory Leak Detection Report ===',
      `Snapshots taken: ${this.snapshots.length}`,
      '',
      'Timeline:',
      ...this.snapshots.map((snapshot, index) => {
        const time = new Date(snapshot.timestamp).toLocaleTimeString();
        return `${index + 1}. [${time}] ${snapshot.description}`;
      }),
      '',
      'Note: Use React DevTools Profiler for detailed memory analysis',
    ];

    return report.join('\n');
  }

  clear(): void {
    this.snapshots = [];
  }
}

/**
 * Show stress test results in an alert
 */
export function showStressTestResults(result: StressTestResult): void {
  const successRate = (result.successfulActions / result.totalActions * 100).toFixed(1);
  
  Alert.alert(
    'Stress Test Results',
    `Total Actions: ${result.totalActions}\n` +
    `Success Rate: ${successRate}%\n` +
    `Average Response: ${result.averageResponseTime.toFixed(0)}ms\n` +
    `Errors: ${result.errors.length}`,
    [{ text: 'OK' }]
  );
}
