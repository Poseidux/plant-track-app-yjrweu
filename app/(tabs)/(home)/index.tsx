
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { StorageService } from '@/utils/storage';
import { TreePlantingLog, EarningsLog } from '@/types/TreePlanting';
import { IconSymbol } from '@/components/IconSymbol';
import { PieChart } from 'react-native-chart-kit';

export default function HomeScreen() {
  const theme = useTheme();
  const [treeLogs, setTreeLogs] = useState<TreePlantingLog[]>([]);
  const [earningsLogs, setEarningsLogs] = useState<EarningsLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [trees, earnings] = await Promise.all([
        StorageService.getTreeLogs(),
        StorageService.getEarningsLogs(),
      ]);
      setTreeLogs(trees);
      setEarningsLogs(earnings);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalTrees = treeLogs.reduce((sum, log) => sum + log.treesPlanted, 0);
  const totalEarnings = earningsLogs.reduce((sum, log) => sum + log.amount, 0);
  const totalDays = treeLogs.length;

  const getSpeciesBreakdown = () => {
    const speciesCount: { [key: string]: number } = {};
    treeLogs.forEach(log => {
      speciesCount[log.species] = (speciesCount[log.species] || 0) + log.treesPlanted;
    });
    return Object.entries(speciesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  const speciesData = getSpeciesBreakdown();
  const chartColors = ['#3498DB', '#2ECC71', '#F39C12', '#E74C3C', '#9B59B6'];

  const pieChartData = speciesData.map(([species, count], index) => ({
    name: species,
    population: count,
    color: chartColors[index % chartColors.length],
    legendFontColor: colors.text,
    legendFontSize: 12,
  }));

  const screenWidth = Dimensions.get('window').width;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🌲 Tree Planter Tracker</Text>
          <Text style={styles.headerSubtitle}>Track your environmental impact</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.primary }]}>
            <IconSymbol
              ios_icon_name="leaf.fill"
              android_material_icon_name="eco"
              size={32}
              color="#FFFFFF"
            />
            <Text style={styles.statNumber}>{totalTrees.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Trees Planted</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.secondary }]}>
            <IconSymbol
              ios_icon_name="dollarsign.circle.fill"
              android_material_icon_name="attach-money"
              size={32}
              color="#FFFFFF"
            />
            <Text style={styles.statNumber}>${totalEarnings.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.accent }]}>
            <IconSymbol
              ios_icon_name="calendar.badge.clock"
              android_material_icon_name="event"
              size={32}
              color="#FFFFFF"
            />
            <Text style={styles.statNumber}>{totalDays}</Text>
            <Text style={styles.statLabel}>Planting Days</Text>
          </View>
        </View>

        {pieChartData.length > 0 && (
          <View style={[commonStyles.card, styles.chartCard]}>
            <Text style={commonStyles.cardTitle}>Species Distribution</Text>
            <PieChart
              data={pieChartData}
              width={screenWidth - 64}
              height={200}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        )}

        {treeLogs.length === 0 && (
          <View style={[commonStyles.card, styles.emptyCard]}>
            <IconSymbol
              ios_icon_name="tree.fill"
              android_material_icon_name="park"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>Start Your Journey</Text>
            <Text style={styles.emptyText}>
              Log your first tree planting session to see your progress!
            </Text>
          </View>
        )}

        {treeLogs.length > 0 && (
          <View style={[commonStyles.card, styles.recentCard]}>
            <Text style={commonStyles.cardTitle}>Recent Activity</Text>
            {treeLogs.slice(-3).reverse().map((log, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <IconSymbol
                    ios_icon_name="leaf.fill"
                    android_material_icon_name="eco"
                    size={20}
                    color={colors.secondary}
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>
                    {log.treesPlanted} {log.species}
                  </Text>
                  <Text style={styles.activityDate}>
                    {new Date(log.date).toLocaleDateString()} • {log.province}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 4,
    textAlign: 'center',
  },
  chartCard: {
    marginBottom: 16,
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  recentCard: {
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  bottomPadding: {
    height: 20,
  },
});
