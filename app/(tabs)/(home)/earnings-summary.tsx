
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
import { EarningsLog, ExpenseLog } from '@/types/TreePlanting';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import { LineChart, BarChart } from 'react-native-chart-kit';

export default function EarningsSummaryScreen() {
  const { colors, isDark } = useThemeContext();
  const router = useRouter();
  const [earningsLogs, setEarningsLogs] = useState<EarningsLog[]>([]);
  const [expenseLogs, setExpenseLogs] = useState<ExpenseLog[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [earnings, expenses] = await Promise.all([
      StorageService.getEarningsLogs(),
      StorageService.getExpenseLogs(),
    ]);
    setEarningsLogs(earnings);
    setExpenseLogs(expenses);
  };

  const totalEarnings = earningsLogs.reduce((sum, log) => sum + log.amount, 0);
  const totalExpenses = expenseLogs.reduce((sum, log) => sum + log.amount, 0);
  const netIncome = totalEarnings - totalExpenses;
  const averageEarningsPerDay = earningsLogs.length > 0 ? totalEarnings / earningsLogs.length : 0;

  const getEarningsChartData = () => {
    const sortedLogs = [...earningsLogs].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const last10 = sortedLogs.slice(-10);
    
    return {
      labels: last10.length > 0 
        ? last10.map(log => new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
        : ['No Data'],
      datasets: [{
        data: last10.length > 0 ? last10.map(log => log.amount) : [0],
      }],
    };
  };

  const getExpensesChartData = () => {
    const sortedLogs = [...expenseLogs].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const last10 = sortedLogs.slice(-10);
    
    return {
      labels: last10.length > 0 
        ? last10.map(log => new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
        : ['No Data'],
      datasets: [{
        data: last10.length > 0 ? last10.map(log => log.amount) : [0],
      }],
    };
  };

  const getCombinedChartData = () => {
    const dateMap: { [key: string]: { earnings: number; expenses: number } } = {};
    
    earningsLogs.forEach(log => {
      const date = new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dateMap[date]) dateMap[date] = { earnings: 0, expenses: 0 };
      dateMap[date].earnings += log.amount;
    });
    
    expenseLogs.forEach(log => {
      const date = new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dateMap[date]) dateMap[date] = { earnings: 0, expenses: 0 };
      dateMap[date].expenses += log.amount;
    });
    
    const sortedDates = Object.keys(dateMap).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    }).slice(-10);
    
    return {
      labels: sortedDates.length > 0 ? sortedDates : ['No Data'],
      datasets: [
        {
          data: sortedDates.length > 0 ? sortedDates.map(date => dateMap[date].earnings) : [0],
          color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
        },
        {
          data: sortedDates.length > 0 ? sortedDates.map(date => dateMap[date].expenses) : [0],
          color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
        },
      ],
      legend: ['Earnings', 'Expenses'],
    };
  };

  const screenWidth = Dimensions.get('window').width;

  const earningsChartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
    labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(45, 52, 54, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: '#2ECC71',
    },
  };

  const expensesChartConfig = {
    ...earningsChartConfig,
    color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: '#E74C3C',
    },
  };

  const combinedChartConfig = {
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Earnings Summary</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Financial Overview</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="dollarsign.circle.fill"
                android_material_icon_name="attach-money"
                size={32}
                color={colors.secondary}
              />
              <Text style={[styles.statValue, { color: colors.secondary }]}>
                ${totalEarnings.toFixed(2)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Total Earnings
              </Text>
            </View>

            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="cart.fill"
                android_material_icon_name="shopping-cart"
                size={32}
                color={colors.error}
              />
              <Text style={[styles.statValue, { color: colors.error }]}>
                ${totalExpenses.toFixed(2)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Total Expenses
              </Text>
            </View>

            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="banknote.fill"
                android_material_icon_name="account-balance-wallet"
                size={32}
                color={netIncome >= 0 ? colors.secondary : colors.error}
              />
              <Text style={[styles.statValue, { color: netIncome >= 0 ? colors.secondary : colors.error }]}>
                ${netIncome.toFixed(2)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Net Income
              </Text>
            </View>

            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="chart.bar.fill"
                android_material_icon_name="bar-chart"
                size={32}
                color={colors.primary}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                ${averageEarningsPerDay.toFixed(2)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Avg Per Day
              </Text>
            </View>
          </View>
        </View>

        {earningsLogs.length >= 2 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Earnings Trend</Text>
            <LineChart
              data={getEarningsChartData()}
              width={screenWidth - 64}
              height={220}
              chartConfig={earningsChartConfig}
              bezier
              style={styles.chart}
              yAxisLabel="$"
              yAxisSuffix=""
            />
          </View>
        )}

        {expenseLogs.length >= 2 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Expenses Trend</Text>
            <LineChart
              data={getExpensesChartData()}
              width={screenWidth - 64}
              height={220}
              chartConfig={expensesChartConfig}
              bezier
              style={styles.chart}
              yAxisLabel="$"
              yAxisSuffix=""
            />
          </View>
        )}

        {earningsLogs.length > 0 && expenseLogs.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Earnings vs Expenses</Text>
            <LineChart
              data={getCombinedChartData()}
              width={screenWidth - 64}
              height={220}
              chartConfig={combinedChartConfig}
              bezier
              style={styles.chart}
              yAxisLabel="$"
              yAxisSuffix=""
            />
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
    fontSize: 24,
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
  bottomPadding: {
    height: 20,
  },
});
