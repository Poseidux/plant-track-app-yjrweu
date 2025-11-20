
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { StorageService } from '@/utils/storage';
import { TreePlantingLog } from '@/types/TreePlanting';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import { PieChart, BarChart } from 'react-native-chart-kit';

export default function TreesSummaryScreen() {
  const { colors, isDark } = useThemeContext();
  const router = useRouter();
  const [treeLogs, setTreeLogs] = useState<TreePlantingLog[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const logs = await StorageService.getTreeLogs();
    setTreeLogs(logs);
  };

  const totalTrees = treeLogs.reduce((sum, log) => sum + log.totalTrees, 0);
  const totalDays = treeLogs.length;
  const averagePerDay = totalDays > 0 ? totalTrees / totalDays : 0;
  const maxTreesInDay = treeLogs.length > 0 ? Math.max(...treeLogs.map(log => log.totalTrees)) : 0;
  const minTreesInDay = treeLogs.length > 0 ? Math.min(...treeLogs.map(log => log.totalTrees)) : 0;

  const getSpeciesBreakdown = () => {
    const speciesCount: { [key: string]: number } = {};
    treeLogs.forEach(log => {
      speciesCount[log.species] = (speciesCount[log.species] || 0) + log.totalTrees;
    });
    return Object.entries(speciesCount).sort((a, b) => b[1] - a[1]);
  };

  const speciesData = getSpeciesBreakdown();
  const chartColors = ['#3498DB', '#2ECC71', '#F39C12', '#E74C3C', '#9B59B6', '#1ABC9C', '#E67E22'];

  const pieChartData = speciesData.slice(0, 7).map(([species, count], index) => ({
    name: species.length > 12 ? species.substring(0, 10) + '...' : species,
    population: count,
    color: chartColors[index % chartColors.length],
    legendFontColor: colors.text,
    legendFontSize: 11,
  }));

  const getMonthlyData = () => {
    const monthlyCount: { [key: string]: number } = {};
    treeLogs.forEach(log => {
      const month = new Date(log.date).toLocaleDateString('en-US', { month: 'short' });
      monthlyCount[month] = (monthlyCount[month] || 0) + log.totalTrees;
    });
    const entries = Object.entries(monthlyCount);
    return {
      labels: entries.map(([month]) => month),
      datasets: [{
        data: entries.map(([, count]) => count),
      }],
    };
  };

  const screenWidth = Dimensions.get('window').width;

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
    labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(45, 52, 54, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={28}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Trees Planted Summary</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Overview</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="leaf.fill"
                android_material_icon_name="eco"
                size={32}
                color={colors.secondary}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {totalTrees.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Total Trees
              </Text>
            </View>

            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="calendar-today"
                size={32}
                color={colors.primary}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {totalDays}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Planting Days
              </Text>
            </View>

            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="chart.bar.fill"
                android_material_icon_name="bar-chart"
                size={32}
                color={colors.accent}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {averagePerDay.toFixed(0)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Avg Per Day
              </Text>
            </View>

            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="arrow.up.circle.fill"
                android_material_icon_name="trending-up"
                size={32}
                color={colors.secondary}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {maxTreesInDay.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Best Day
              </Text>
            </View>
          </View>
        </View>

        {pieChartData.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Species Distribution</Text>
            <PieChart
              data={pieChartData}
              width={screenWidth - 64}
              height={220}
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

        {treeLogs.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Monthly Breakdown</Text>
            <BarChart
              data={getMonthlyData()}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              yAxisLabel=""
              yAxisSuffix=""
            />
          </View>
        )}

        <View style={[styles.listCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Species Breakdown</Text>
          {speciesData.map(([species, count], index) => (
            <View key={`species-list-${species}-${index}`} style={[styles.listItem, { borderBottomColor: colors.border }]}>
              <View style={styles.listItemLeft}>
                <View style={[styles.colorDot, { backgroundColor: chartColors[index % chartColors.length] }]} />
                <Text style={[styles.listItemText, { color: colors.text }]}>{species}</Text>
              </View>
              <Text style={[styles.listItemValue, { color: colors.text }]}>
                {count.toLocaleString()} ({((count / totalTrees) * 100).toFixed(1)}%)
              </Text>
            </View>
          ))}
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
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    width: (Dimensions.get('window').width - 84) / 2,
    alignItems: 'center',
    padding: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  chartCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  listCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  listItemText: {
    fontSize: 15,
    flex: 1,
  },
  listItemValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 20,
  },
});
