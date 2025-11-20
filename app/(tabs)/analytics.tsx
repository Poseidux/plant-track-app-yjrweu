
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  ImageBackground,
} from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { StorageService } from '@/utils/storage';
import { TreePlantingLog, EarningsLog, ExpenseLog, Achievement } from '@/types/TreePlanting';
import { IconSymbol } from '@/components/IconSymbol';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { checkAchievements } from '@/utils/achievements';

export default function AnalyticsScreen() {
  const { colors, isDark } = useThemeContext();
  const [treeLogs, setTreeLogs] = useState<TreePlantingLog[]>([]);
  const [earningsLogs, setEarningsLogs] = useState<EarningsLog[]>([]);
  const [expenseLogs, setExpenseLogs] = useState<ExpenseLog[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [trees, earnings, expenses, savedAchievements] = await Promise.all([
      StorageService.getTreeLogs(),
      StorageService.getEarningsLogs(),
      StorageService.getExpenseLogs(),
      StorageService.getAchievements(),
    ]);
    setTreeLogs(trees);
    setEarningsLogs(earnings);
    setExpenseLogs(expenses);
    
    const updatedAchievements = checkAchievements(trees, earnings, savedAchievements);
    setAchievements(updatedAchievements);
    await StorageService.saveAchievements(updatedAchievements);
  };

  const totalTrees = treeLogs.reduce((sum, log) => sum + log.totalTrees, 0);
  const totalEarnings = earningsLogs.reduce((sum, log) => sum + log.amount, 0);
  const totalExpenses = expenseLogs.reduce((sum, log) => sum + log.amount, 0);
  const totalDays = treeLogs.length;
  const averageTreesPerDay = totalDays > 0 ? totalTrees / totalDays : 0;
  const unlockedAchievements = achievements.filter(a => a.progress >= a.target);

  const totalHours = treeLogs.reduce((sum, log) => {
    return sum + log.hourlyLogs.reduce((hourSum, hourLog) => {
      const start = new Date(`2000-01-01T${hourLog.startTime}`);
      const end = new Date(`2000-01-01T${hourLog.endTime}`);
      return hourSum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);
  }, 0);
  
  const treesPerHour = totalHours > 0 ? totalTrees / totalHours : 0;
  const treesPerMinute = treesPerHour / 60;

  const midPoint = Math.floor(treeLogs.length / 2);
  const firstHalfAvg = midPoint > 0 
    ? treeLogs.slice(0, midPoint).reduce((sum, log) => sum + log.totalTrees, 0) / midPoint
    : 0;
  const secondHalfAvg = treeLogs.length > midPoint
    ? treeLogs.slice(midPoint).reduce((sum, log) => sum + log.totalTrees, 0) / (treeLogs.length - midPoint)
    : 0;
  const percentageImprovement = firstHalfAvg > 0 
    ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
    : 0;

  const getTreesChartData = () => {
    const sortedLogs = [...treeLogs].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const last7 = sortedLogs.slice(-7);
    
    return {
      labels: last7.length > 0 
        ? last7.map(log => new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
        : ['No Data'],
      datasets: [{
        data: last7.length > 0 ? last7.map(log => log.totalTrees) : [0],
      }],
    };
  };

  const getEarningsChartData = () => {
    const sortedLogs = [...earningsLogs].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const last7 = sortedLogs.slice(-7);
    
    return {
      labels: last7.length > 0 
        ? last7.map(log => new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
        : ['No Data'],
      datasets: [{
        data: last7.length > 0 ? last7.map(log => log.amount) : [0],
      }],
    };
  };

  const getRateChartData = () => {
    const sortedLogs = [...treeLogs].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const last7 = sortedLogs.slice(-7);
    
    return {
      labels: last7.length > 0 
        ? last7.map(log => new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
        : ['No Data'],
      datasets: [{
        data: last7.length > 0 ? last7.map(log => log.averageRate || 0) : [0],
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
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: colors.primary,
    },
  };

  const earningsChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: colors.secondary,
    },
  };

  const rateChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => `rgba(243, 156, 18, ${opacity})`,
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: colors.accent,
    },
  };

  const performanceItems = [
    {
      icon: 'leaf.fill',
      androidIcon: 'eco',
      color: colors.secondary,
      label: 'Total Trees',
      value: totalTrees.toLocaleString(),
    },
    {
      icon: 'calendar',
      androidIcon: 'calendar-today',
      color: colors.primary,
      label: 'Planting Days',
      value: totalDays.toString(),
    },
    {
      icon: 'dollarsign.circle.fill',
      androidIcon: 'attach-money',
      color: colors.secondary,
      label: 'Total Earnings',
      value: `$${totalEarnings.toFixed(2)}`,
    },
    {
      icon: 'cart.fill',
      androidIcon: 'shopping-cart',
      color: colors.error,
      label: 'Total Expenses',
      value: `$${totalExpenses.toFixed(2)}`,
    },
    {
      icon: 'clock.fill',
      androidIcon: 'schedule',
      color: colors.accent,
      label: 'Trees/Hour',
      value: treesPerHour.toFixed(0),
    },
    {
      icon: 'timer',
      androidIcon: 'timer',
      color: colors.warning,
      label: 'Trees/Minute',
      value: treesPerMinute.toFixed(1),
    },
    {
      icon: 'chart.line.uptrend.xyaxis',
      androidIcon: 'trending-up',
      color: colors.primary,
      label: 'Avg Trees/Day',
      value: averageTreesPerDay.toFixed(0),
    },
    {
      icon: 'percent',
      androidIcon: 'trending-up',
      color: percentageImprovement >= 0 ? colors.secondary : colors.error,
      label: 'Improvement',
      value: `${percentageImprovement >= 0 ? '+' : ''}${percentageImprovement.toFixed(1)}%`,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1511497584788-876760111969?w=800&q=80' }}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.85)' }]} />
      </ImageBackground>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Analytics & Achievements</Text>
        </View>

        <View style={[styles.overviewCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.overviewTitle, { color: colors.text }]}>Performance Overview</Text>
          
          <View style={styles.overviewGrid}>
            {performanceItems.map((item, index) => (
              <View key={`perf-item-${index}`} style={styles.overviewItem}>
                <IconSymbol
                  ios_icon_name={item.icon}
                  android_material_icon_name={item.androidIcon}
                  size={20}
                  color={item.color}
                />
                <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>
                  {item.label}
                </Text>
                <Text style={[styles.overviewValue, { color: colors.text }]}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {treeLogs.length >= 2 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              Trees Planted (Last 7 Days)
            </Text>
            <LineChart
              data={getTreesChartData()}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {earningsLogs.length >= 2 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              Earnings (Last 7 Days)
            </Text>
            <BarChart
              data={getEarningsChartData()}
              width={screenWidth - 64}
              height={220}
              chartConfig={earningsChartConfig}
              style={styles.chart}
              yAxisLabel="$"
              yAxisSuffix=""
            />
          </View>
        )}

        {treeLogs.length >= 2 && treeLogs.some(log => log.averageRate) && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              Planting Rate (Last 7 Days)
            </Text>
            <LineChart
              data={getRateChartData()}
              width={screenWidth - 64}
              height={220}
              chartConfig={rateChartConfig}
              bezier
              style={styles.chart}
            />
            <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
              Trees per hour
            </Text>
          </View>
        )}

        <View style={[styles.achievementsCard, { backgroundColor: colors.card }]}>
          <View style={styles.achievementsHeader}>
            <IconSymbol
              ios_icon_name="trophy.fill"
              android_material_icon_name="emoji-events"
              size={28}
              color={colors.gold}
            />
            <Text style={[styles.achievementsTitle, { color: colors.text }]}>
              Achievements & Badges
            </Text>
          </View>
          
          <View style={[styles.achievementsSummary, { backgroundColor: colors.highlight }]}>
            <Text style={[styles.achievementsSummaryText, { color: colors.text }]}>
              {unlockedAchievements.length} of {achievements.length} unlocked
            </Text>
          </View>

          {achievements.length === 0 ? (
            <Text style={[styles.achievementsEmpty, { color: colors.textSecondary }]}>
              Start planting trees to unlock achievements!
            </Text>
          ) : (
            <View style={styles.achievementsList}>
              {achievements.map((achievement, index) => {
                const isUnlocked = achievement.progress >= achievement.target;
                return (
                  <View 
                    key={`achievement-${achievement.id}-${index}`}
                    style={[
                      styles.achievementItem,
                      { backgroundColor: isUnlocked ? colors.highlight : colors.background },
                      { borderColor: colors.border }
                    ]}
                  >
                    <View style={styles.achievementIcon}>
                      <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
                      {isUnlocked && (
                        <View style={[styles.achievementBadge, { backgroundColor: colors.gold }]}>
                          <IconSymbol
                            ios_icon_name="checkmark"
                            android_material_icon_name="check"
                            size={12}
                            color="#FFFFFF"
                          />
                        </View>
                      )}
                    </View>
                    <View style={styles.achievementContent}>
                      <Text style={[styles.achievementTitle, { color: colors.text }]}>
                        {achievement.title}
                      </Text>
                      <Text style={[styles.achievementDescription, { color: colors.textSecondary }]}>
                        {achievement.description}
                      </Text>
                      <View style={styles.achievementProgress}>
                        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                          <View 
                            style={[
                              styles.progressFill, 
                              { 
                                backgroundColor: isUnlocked ? colors.gold : colors.primary,
                                width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%`
                              }
                            ]} 
                          />
                        </View>
                        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                          {achievement.progress}/{achievement.target}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={[styles.tipsCard, { backgroundColor: colors.card }]}>
          <View style={styles.tipsHeader}>
            <IconSymbol
              ios_icon_name="lightbulb.fill"
              android_material_icon_name="lightbulb"
              size={28}
              color={colors.accent}
            />
            <Text style={[styles.tipsTitle, { color: colors.text }]}>
              Tips & Tricks
            </Text>
          </View>
          
          <View style={styles.tipsList}>
            {[
              'Plant in the morning when soil is moist and temperatures are cooler',
              'Use proper planting technique: J-root method for better survival rates',
              'Take regular breaks to maintain consistent planting speed',
              'Stay hydrated and bring high-energy snacks for sustained performance',
              'Adjust your technique for different terrain types and soil conditions'
            ].map((tip, index) => (
              <View key={`tip-${index}`} style={styles.tipItem}>
                <Text style={[styles.tipNumber, { color: colors.primary }]}>{index + 1}</Text>
                <Text style={[styles.tipText, { color: colors.text }]}>
                  {tip}
                </Text>
              </View>
            ))}
          </View>
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
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    opacity: 0.08,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'android' ? 60 : 80,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  overviewCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  overviewItem: {
    width: (Dimensions.get('window').width - 76) / 2,
    alignItems: 'center',
    padding: 12,
  },
  overviewLabel: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  chartCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  chartSubtitle: {
    fontSize: 13,
    marginTop: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  achievementsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  achievementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  achievementsTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  achievementsSummary: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  achievementsSummaryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  achievementsEmpty: {
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 20,
  },
  achievementsList: {
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  achievementIcon: {
    position: 'relative',
    marginRight: 12,
  },
  achievementEmoji: {
    fontSize: 40,
  },
  achievementBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 13,
    marginBottom: 8,
  },
  achievementProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 50,
  },
  tipsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  tipsTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  tipsList: {
    gap: 16,
  },
  tipItem: {
    flexDirection: 'row',
    gap: 12,
  },
  tipNumber: {
    fontSize: 18,
    fontWeight: '700',
    width: 28,
    height: 28,
    textAlign: 'center',
    lineHeight: 28,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  bottomPadding: {
    height: 20,
  },
});
