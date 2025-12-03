
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import {
  runStressTest,
  stressTestNavigation,
  showStressTestResults,
  MemoryLeakDetector,
  StressTestConfig,
} from '@/utils/stressTest';
import { performanceMonitor } from '@/utils/performanceMonitor';

const memoryDetector = new MemoryLeakDetector();

export default function PerformanceTestScreen() {
  const { colors } = useThemeContext();
  const router = useRouter();
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<string>('');

  const handleNavigationStressTest = async () => {
    setTesting(true);
    setTestResults('Running navigation stress test...');

    const config: StressTestConfig = {
      duration: 10000, // 10 seconds
      actionsPerSecond: 5,
      logResults: false,
    };

    const routes = [
      '/(tabs)/(home)/',
      '/(tabs)/tracker',
      '/(tabs)/earnings',
      '/(tabs)/analytics',
      '/(tabs)/profile',
    ];

    try {
      const result = await stressTestNavigation(
        (route) => router.push(route as any),
        routes,
        config
      );

      const successRate = (result.successfulActions / result.totalActions * 100).toFixed(1);
      const resultsText = 
        `Navigation Stress Test Results:\n\n` +
        `Total Actions: ${result.totalActions}\n` +
        `Success Rate: ${successRate}%\n` +
        `Average Response: ${result.averageResponseTime.toFixed(0)}ms\n` +
        `Errors: ${result.errors.length}`;

      setTestResults(resultsText);
      showStressTestResults(result);
    } catch (error) {
      setTestResults(`Test failed: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  const handleMemorySnapshot = () => {
    memoryDetector.takeSnapshot(`Manual snapshot at ${new Date().toLocaleTimeString()}`);
    Alert.alert('Snapshot Taken', 'Memory snapshot recorded');
  };

  const handleMemoryReport = () => {
    const report = memoryDetector.getReport();
    Alert.alert('Memory Report', report);
  };

  const handlePerformanceMetrics = () => {
    performanceMonitor.logMetrics();
    Alert.alert('Performance Metrics', 'Check console for detailed metrics');
  };

  const handleClearMetrics = () => {
    performanceMonitor.clearMetrics();
    memoryDetector.clear();
    setTestResults('');
    Alert.alert('Cleared', 'All metrics and snapshots cleared');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Performance Testing</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={32}
            color={colors.primary}
          />
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            Performance Testing Tools
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Use these tools to test app stability under heavy load and identify performance issues.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Stress Tests</Text>
          
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.primary }]}
            onPress={handleNavigationStressTest}
            disabled={testing}
          >
            <IconSymbol
              ios_icon_name="arrow.triangle.swap"
              android_material_icon_name="swap-horiz"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.testButtonText}>
              {testing ? 'Testing...' : 'Navigation Stress Test'}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.testDescription, { color: colors.textSecondary }]}>
            Rapidly navigates between screens for 10 seconds to test stability
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Memory Monitoring</Text>
          
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.secondary }]}
            onPress={handleMemorySnapshot}
          >
            <IconSymbol
              ios_icon_name="camera.fill"
              android_material_icon_name="camera"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.testButtonText}>Take Memory Snapshot</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.accent }]}
            onPress={handleMemoryReport}
          >
            <IconSymbol
              ios_icon_name="doc.text.fill"
              android_material_icon_name="description"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.testButtonText}>View Memory Report</Text>
          </TouchableOpacity>

          <Text style={[styles.testDescription, { color: colors.textSecondary }]}>
            Track memory usage over time to detect potential leaks
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Performance Metrics</Text>
          
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.warning }]}
            onPress={handlePerformanceMetrics}
          >
            <IconSymbol
              ios_icon_name="chart.bar.fill"
              android_material_icon_name="bar-chart"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.testButtonText}>View Performance Metrics</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.error }]}
            onPress={handleClearMetrics}
          >
            <IconSymbol
              ios_icon_name="trash.fill"
              android_material_icon_name="delete"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.testButtonText}>Clear All Metrics</Text>
          </TouchableOpacity>

          <Text style={[styles.testDescription, { color: colors.textSecondary }]}>
            View timing metrics for operations and clear collected data
          </Text>
        </View>

        {testResults !== '' && (
          <View style={[styles.resultsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.resultsTitle, { color: colors.text }]}>Test Results</Text>
            <Text style={[styles.resultsText, { color: colors.textSecondary }]}>
              {testResults}
            </Text>
          </View>
        )}

        <View style={[styles.tipsCard, { backgroundColor: colors.highlight }]}>
          <Text style={[styles.tipsTitle, { color: colors.text }]}>Testing Tips</Text>
          <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
            - Run tests multiple times for consistent results{'\n'}
            - Monitor console logs for detailed information{'\n'}
            - Take memory snapshots before and after heavy operations{'\n'}
            - Check performance metrics regularly during development
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  testDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  resultsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  resultsText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  tipsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 13,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 20,
  },
});
