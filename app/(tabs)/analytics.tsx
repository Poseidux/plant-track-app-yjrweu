
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
import { TreePlantingLog, EarningsLog, Achievement } from '@/types/TreePlanting';
import { IconSymbol } from '@/components/IconSymbol';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { checkAchievements } from '@/utils/achievements';

export default function AnalyticsScreen() {
  const { colors, isDark } = useThemeContext();
  const [treeLogs, setTreeLogs] = useState<TreePlantingLog[]>([]);
  const [earningsLogs, setEarningsLogs] = useState<EarningsLog[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [trees, earnings, savedAchievements] = await Promise.all([
      StorageService.getTreeLogs(),
      StorageService.getEarningsLogs(),
      StorageService.getAchievements(),
    ]);
    setTreeLogs(trees);
    setEarningsLogs(earnings);
    
    const updatedAchievements = checkAchievements(trees, earnings, savedAchievements);
    setAchievements(updatedAchievements);
    await StorageService.saveAchievements(updatedAchievements);
  };

  const totalTrees = treeLogs.reduce((sum, log) => sum + log.totalTrees, 0);
  const totalEarnings = earningsLogs.reduce((sum, log) => sum + log.amount, 0);
  const averageTreesPerDay = treeLogs.length > 0 ? totalTrees / treeLogs.length : 0;
  const averageEarningsPerDay = earningsLogs.length > 0 ? totalEarnings / earningsLogs.length : 0;
  const unlockedAchievements = achievements.filter(a => a.progress >= a.target);

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>📊 Analytics & Achievements</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Track your performance and unlock badges
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <IconSymbol
              ios_icon_name="leaf.fill"
              android_material_icon_name="eco"
              size={24}
              color={colors.secondary}
            />
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {totalTrees.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Trees
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <IconSymbol
              ios_icon_name="dollarsign.circle.fill"
              android_material_icon_name="attach-money"
              size={24}
              color={colors.primary}
            />
            <Text style={[styles.statNumber, { color: colors.text }]}>
              ${totalEarnings.toFixed(0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Earned
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <IconSymbol
              ios_icon_name="chart.line.uptrend.xyaxis"
              android_material_icon_name="trending-up"
              size={24}
              color={colors.accent}
            />
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {averageTreesPerDay.toFixed(0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Avg Trees/Day
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <IconSymbol
              ios_icon_name="trophy.fill"
              android_material_icon_name="emoji-events"
              size={24}
              color={colors.gold}
            />
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {unlockedAchievements.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Badges Earned
            </Text>
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
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
              }}
              style={styles.chart}
              yAxisLabel="$"
              yAxisSuffix=""
            />
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
                    key={index} 
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
            <View style={styles.tipItem}>
              <Text style={[styles.tipNumber, { color: colors.primary }]}>1</Text>
              <Text style={[styles.tipText, { color: colors.text }]}>
                Plant in the morning when soil is moist and temperatures are cooler
              </Text>
            </View>
            
            <View style={styles.tipItem}>
              <Text style={[styles.tipNumber, { color: colors.primary }]}>2</Text>
              <Text style={[styles.tipText, { color: colors.text }]}>
                Use proper planting technique: J-root method for better survival rates
              </Text>
            </View>
            
            <View style={styles.tipItem}>
              <Text style={[styles.tipNumber, { color: colors.primary }]}>3</Text>
              <Text style={[styles.tipText, { color: colors.text }]}>
                Take regular breaks to maintain consistent planting speed
              </Text>
            </View>
            
            <View style={styles.tipItem}>
              <Text style={[styles.tipNumber, { color: colors.primary }]}>4</Text>
              <Text style={[styles.tipText, { color: colors.text }]}>
                Stay hydrated and bring high-energy snacks for sustained performance
              </Text>
            </View>
            
            <View style={styles.tipItem}>
              <Text style={[styles.tipNumber, { color: colors.primary }]}>5</Text>
              <Text style={[styles.tipText, { color: colors.text }]}>
                Adjust your technique for different terrain types and soil conditions
              </Text>
            </View>
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
    paddingTop: Platform.OS === 'android' ? 60 : 16,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (Dimensions.get('window').width - 44) / 2,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
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
    marginBottom: 20,
    gap: 12,
  },
  achievementsTitle: {
    fontSize: 22,
    fontWeight: '700',
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
