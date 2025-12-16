
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  ImageBackground,
  TouchableOpacity,
  Animated,
  Modal,
} from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { StorageService } from '@/utils/storage';
import { ShopStorageService } from '@/utils/shopStorage';
import { TreePlantingLog, EarningsLog, ExpenseLog, Achievement, UserProfile } from '@/types/TreePlanting';
import { IconSymbol } from '@/components/IconSymbol';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { checkAchievements } from '@/utils/achievements';
import { formatLargeNumber } from '@/utils/formatNumber';
import { shareStatsAsImage } from '@/utils/shareStatsImage';
import { AVATAR_FRAMES, PROFILE_ICONS_EMOJIS } from '@/types/Shop';

// Memoized performance item component
const PerformanceItem = React.memo(({ 
  icon, 
  androidIcon, 
  color, 
  label, 
  value 
}: {
  icon: string;
  androidIcon: string;
  color: string;
  label: string;
  value: string;
}) => (
  <View style={styles.overviewItem}>
    <IconSymbol
      ios_icon_name={icon}
      android_material_icon_name={androidIcon}
      size={20}
      color={color}
    />
    <Text style={[styles.overviewLabel, { color: '#747A7C' }]}>
      {label}
    </Text>
    <Text style={[styles.overviewValue, { color: '#2D3436' }]}>
      {value}
    </Text>
  </View>
));

export default function AnalyticsScreen() {
  const { colors, isDark } = useThemeContext();
  const [treeLogs, setTreeLogs] = useState<TreePlantingLog[]>([]);
  const [earningsLogs, setEarningsLogs] = useState<EarningsLog[]>([]);
  const [expenseLogs, setExpenseLogs] = useState<ExpenseLog[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cardRotation] = useState(new Animated.Value(0));
  const [showFullscreenPerformance, setShowFullscreenPerformance] = useState(false);
  const shareViewRef = useRef(null);
  const [equippedFrame, setEquippedFrame] = useState<string | undefined>();
  const [equippedAvatar, setEquippedAvatar] = useState<string | undefined>();

  useEffect(() => {
    loadData();
    startCardAnimation();
  }, [loadData, startCardAnimation]);

  const startCardAnimation = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(cardRotation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(cardRotation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [cardRotation]);

  const loadData = useCallback(async () => {
    const [trees, earnings, expenses, savedAchievements, userProfile, cosmetics] = await Promise.all([
      StorageService.getTreeLogs(),
      StorageService.getEarningsLogs(),
      StorageService.getExpenseLogs(),
      StorageService.getAchievements(),
      StorageService.getUserProfile(),
      ShopStorageService.getUserCosmetics(),
    ]);
    setTreeLogs(trees);
    setEarningsLogs(earnings);
    setExpenseLogs(expenses);
    setProfile(userProfile);
    setEquippedFrame(cosmetics.equippedAvatarFrame);
    setEquippedAvatar(cosmetics.equippedAvatar);
    
    const updatedAchievements = checkAchievements(trees, earnings, savedAchievements);
    setAchievements(updatedAchievements);
    await StorageService.saveAchievements(updatedAchievements);
  }, []);

  // Memoize calculated values
  const totalTrees = useMemo(() => treeLogs.reduce((sum, log) => sum + log.totalTrees, 0), [treeLogs]);
  const totalEarnings = useMemo(() => earningsLogs.reduce((sum, log) => sum + log.amount, 0), [earningsLogs]);
  const totalExpenses = useMemo(() => expenseLogs.reduce((sum, log) => sum + log.amount, 0), [expenseLogs]);
  const totalDays = useMemo(() => treeLogs.filter(log => log.dayType !== 'sick' && log.dayType !== 'dayoff').length, [treeLogs]);
  const averageTreesPerDay = useMemo(() => totalDays > 0 ? totalTrees / totalDays : 0, [totalTrees, totalDays]);
  const unlockedAchievements = useMemo(() => achievements.filter(a => a.progress >= a.target), [achievements]);

  const personalBest = useMemo(() => treeLogs.length > 0 
    ? Math.max(...treeLogs.map(log => log.totalTrees))
    : 0, [treeLogs]);

  // FIXED: Calculate total hours and trees per hour/minute correctly
  const totalHours = useMemo(() => {
    return treeLogs.reduce((sum, log) => {
      if (!log.hourlyLogs || log.hourlyLogs.length === 0) {
        return sum;
      }
      
      return sum + log.hourlyLogs.reduce((hourSum, hourLog) => {
        try {
          const start = new Date(`2000-01-01T${hourLog.startTime}`);
          const end = new Date(`2000-01-01T${hourLog.endTime}`);
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          return hourSum + (isNaN(hours) ? 0 : hours);
        } catch (error) {
          console.error('Error calculating hours:', error);
          return hourSum;
        }
      }, 0);
    }, 0);
  }, [treeLogs]);
  
  const treesPerHour = useMemo(() => totalHours > 0 ? totalTrees / totalHours : 0, [totalTrees, totalHours]);
  const treesPerMinute = useMemo(() => treesPerHour / 60, [treesPerHour]);

  const midPoint = useMemo(() => Math.floor(treeLogs.length / 2), [treeLogs]);
  const firstHalfAvg = useMemo(() => midPoint > 0 
    ? treeLogs.slice(0, midPoint).reduce((sum, log) => sum + log.totalTrees, 0) / midPoint
    : 0, [treeLogs, midPoint]);
  const secondHalfAvg = useMemo(() => treeLogs.length > midPoint
    ? treeLogs.slice(midPoint).reduce((sum, log) => sum + log.totalTrees, 0) / (treeLogs.length - midPoint)
    : 0, [treeLogs, midPoint]);
  const percentageImprovement = useMemo(() => firstHalfAvg > 0 
    ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
    : 0, [firstHalfAvg, secondHalfAvg]);

  const today = new Date().toISOString().split('T')[0];
  const todayLog = useMemo(() => treeLogs.find(log => log.date === today), [treeLogs, today]);
  const todayTrees = useMemo(() => todayLog ? todayLog.totalTrees : 0, [todayLog]);
  const todayHours = useMemo(() => todayLog ? (todayLog.hourlyLogs || []).length : 0, [todayLog]);
  const todayRate = useMemo(() => todayHours > 0 ? todayTrees / todayHours : 0, [todayTrees, todayHours]);

  const getSpeciesDistribution = useCallback(() => {
    const speciesCount: { [key: string]: number } = {};
    
    treeLogs.forEach(log => {
      (log.hourlyLogs || []).forEach(hourlyLog => {
        const species = hourlyLog.species || log.species || 'Unknown';
        speciesCount[species] = (speciesCount[species] || 0) + hourlyLog.treesPlanted;
      });
    });
    
    return Object.entries(speciesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [treeLogs]);

  const speciesData = useMemo(() => getSpeciesDistribution(), [getSpeciesDistribution]);
  const speciesColors = useMemo(() => ['#3498DB', '#2ECC71', '#F39C12', '#E74C3C', '#9B59B6', '#1ABC9C'], []);

  const pieChartData = useMemo(() => speciesData.map(([species, count], index) => ({
    name: species.length > 12 ? species.substring(0, 10) + '...' : species,
    population: count,
    color: speciesColors[index % speciesColors.length],
    legendFontColor: colors.text,
    legendFontSize: 11,
  })), [speciesData, speciesColors, colors.text]);

  const getTreesChartData = useMemo(() => {
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
  }, [treeLogs]);

  const getEarningsChartData = useMemo(() => {
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
  }, [earningsLogs]);

  const getRateChartData = useMemo(() => {
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
  }, [treeLogs]);

  const handleShareStats = useCallback(async () => {
    if (shareViewRef.current) {
      await shareStatsAsImage(shareViewRef.current);
    }
  }, []);

  const getFrameStyle = useCallback(() => {
    if (!equippedFrame) return null;
    const frame = AVATAR_FRAMES.find(f => f.id === equippedFrame);
    return frame;
  }, [equippedFrame]);

  const getAvatarEmoji = useCallback(() => {
    if (!equippedAvatar) return '👤';
    const avatar = PROFILE_ICONS_EMOJIS.find(i => i.id === equippedAvatar);
    return avatar?.emoji || '👤';
  }, [equippedAvatar]);

  const screenWidth = Dimensions.get('window').width;

  const chartConfig = useMemo(() => ({
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
  }), [colors, isDark]);

  const earningsChartConfig = useMemo(() => ({
    ...chartConfig,
    color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: colors.secondary,
    },
  }), [chartConfig, colors.secondary]);

  const rateChartConfig = useMemo(() => ({
    ...chartConfig,
    color: (opacity = 1) => `rgba(243, 156, 18, ${opacity})`,
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: colors.accent,
    },
  }), [chartConfig, colors.accent]);

  const performanceItems = useMemo(() => [
    {
      icon: 'leaf.fill',
      androidIcon: 'eco',
      color: colors.secondary,
      label: 'Total Trees',
      value: formatLargeNumber(totalTrees),
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
      value: totalEarnings >= 100000 ? `$${formatLargeNumber(totalEarnings)}` : `$${totalEarnings.toFixed(2)}`,
    },
    {
      icon: 'cart.fill',
      androidIcon: 'shopping-cart',
      color: colors.error,
      label: 'Total Expenses',
      value: totalExpenses >= 100000 ? `$${formatLargeNumber(totalExpenses)}` : `$${totalExpenses.toFixed(2)}`,
    },
    {
      icon: 'clock.fill',
      androidIcon: 'schedule',
      color: colors.accent,
      label: 'Trees/Hour',
      value: treesPerHour > 0 ? treesPerHour.toFixed(0) : '0',
    },
    {
      icon: 'timer',
      androidIcon: 'timer',
      color: colors.warning,
      label: 'Trees/Minute',
      value: treesPerMinute > 0 ? treesPerMinute.toFixed(1) : '0.0',
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
  ], [colors, totalTrees, totalDays, totalEarnings, totalExpenses, treesPerHour, treesPerMinute, averageTreesPerDay, percentageImprovement]);

  const incompleteAchievements = useMemo(() => achievements.filter(a => a.progress < a.target), [achievements]);
  const displayedAchievements = useMemo(() => showAllAchievements 
    ? achievements 
    : incompleteAchievements.slice(0, 10), [showAllAchievements, achievements, incompleteAchievements]);

  const rotateInterpolate = cardRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '5deg'],
  });

  const frameStyle = getFrameStyle();

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
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={100}
        initialNumToRender={5}
        windowSize={5}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Analytics & Achievements</Text>
        </View>

        <View style={[styles.overviewCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.overviewTitle, { color: colors.text }]}>Performance Overview</Text>
          
          <View style={styles.overviewGrid}>
            {performanceItems.map((item, index) => (
              <PerformanceItem
                key={`perf-item-${index}`}
                icon={item.icon}
                androidIcon={item.androidIcon}
                color={item.color}
                label={item.label}
                value={item.value}
              />
            ))}
          </View>
        </View>

        {treeLogs.length >= 2 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              Trees Planted (Last 7 Days)
            </Text>
            <LineChart
              data={getTreesChartData}
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
              data={getEarningsChartData}
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
              data={getRateChartData}
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

        {pieChartData.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Species Distribution</Text>
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
            <View style={styles.speciesLegend}>
              {speciesData.map(([species, count], index) => (
                <View key={`species-legend-${index}`} style={styles.speciesLegendItem}>
                  <View style={[styles.speciesLegendColor, { backgroundColor: speciesColors[index % speciesColors.length] }]} />
                  <Text style={[styles.speciesLegendText, { color: colors.text }]} numberOfLines={1}>
                    {species}: {count.toLocaleString()} trees
                  </Text>
                </View>
              ))}
            </View>
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
            <>
              <View style={styles.achievementsList}>
                {displayedAchievements.map((achievement, index) => {
                  const isUnlocked = achievement.progress >= achievement.target;

                  return (
                    <View 
                      key={`achievement-${index}`}
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
              
              {!showAllAchievements && incompleteAchievements.length > 10 && (
                <TouchableOpacity
                  style={[styles.showMoreButton, { backgroundColor: colors.primary }]}
                  onPress={() => setShowAllAchievements(true)}
                >
                  <Text style={styles.showMoreButtonText}>Show More</Text>
                  <IconSymbol
                    ios_icon_name="chevron.down"
                    android_material_icon_name="expand-more"
                    size={20}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              )}
              
              {showAllAchievements && (
                <TouchableOpacity
                  style={[styles.showMoreButton, { backgroundColor: colors.textSecondary }]}
                  onPress={() => setShowAllAchievements(false)}
                >
                  <Text style={styles.showMoreButtonText}>Show Less</Text>
                  <IconSymbol
                    ios_icon_name="chevron.up"
                    android_material_icon_name="expand-less"
                    size={20}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {profile && (
          <Animated.View 
            style={[
              styles.performanceCard, 
              { 
                backgroundColor: colors.card,
                transform: [
                  { perspective: 1000 },
                  { rotateY: rotateInterpolate },
                ],
              }
            ]}
          >
            <View style={[styles.performanceCardGlow, { backgroundColor: colors.primary }]} />
            <View style={styles.performanceCardContent}>
              <View style={styles.performanceCardHeader}>
                <View style={[
                  styles.performanceAvatarContainer,
                  {
                    borderWidth: frameStyle ? frameStyle.borderWidth : 3,
                    borderColor: frameStyle ? frameStyle.borderColor : colors.primary,
                  }
                ]}>
                  <Text style={styles.performanceAvatarEmoji}>{getAvatarEmoji()}</Text>
                </View>
                <Text style={[styles.performanceCardName, { color: colors.text }]}>
                  {profile.name}
                </Text>
              </View>
              
              <View style={styles.performanceCardStats}>
                <View style={styles.performanceCardStat}>
                  <Text style={[styles.performanceCardStatLabel, { color: colors.textSecondary }]}>
                    PB (Personal Best)
                  </Text>
                  <Text style={[styles.performanceCardStatValue, { color: colors.primary }]}>
                    {formatLargeNumber(personalBest)}
                  </Text>
                  <Text style={[styles.performanceCardStatUnit, { color: colors.textSecondary }]}>
                    trees/day
                  </Text>
                </View>
                
                <View style={[styles.performanceCardDivider, { backgroundColor: colors.border }]} />
                
                <View style={styles.performanceCardStat}>
                  <Text style={[styles.performanceCardStatLabel, { color: colors.textSecondary }]}>
                    Avg Rate
                  </Text>
                  <Text style={[styles.performanceCardStatValue, { color: colors.secondary }]}>
                    {formatLargeNumber(Math.round(averageTreesPerDay))}
                  </Text>
                  <Text style={[styles.performanceCardStatUnit, { color: colors.textSecondary }]}>
                    trees/day
                  </Text>
                </View>
                
                <View style={[styles.performanceCardDivider, { backgroundColor: colors.border }]} />
                
                <View style={styles.performanceCardStat}>
                  <Text style={[styles.performanceCardStatLabel, { color: colors.textSecondary }]}>
                    Total Trees
                  </Text>
                  <Text style={[styles.performanceCardStatValue, { color: colors.accent }]}>
                    {formatLargeNumber(totalTrees)}
                  </Text>
                  <Text style={[styles.performanceCardStatUnit, { color: colors.textSecondary }]}>
                    planted
                  </Text>
                </View>
              </View>

              <View style={styles.performanceCardActions}>
                <TouchableOpacity
                  style={[styles.performanceCardButton, { backgroundColor: colors.primary }]}
                  onPress={() => setShowFullscreenPerformance(true)}
                >
                  <IconSymbol
                    ios_icon_name="arrow.up.left.and.arrow.down.right"
                    android_material_icon_name="fullscreen"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.performanceCardButtonText}>Fullscreen</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.performanceCardButton, { backgroundColor: colors.secondary }]}
                  onPress={handleShareStats}
                >
                  <IconSymbol
                    ios_icon_name="square.and.arrow.up"
                    android_material_icon_name="share"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.performanceCardButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}

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

      <Modal
        visible={showFullscreenPerformance}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={[styles.fullscreenContainer, { backgroundColor: colors.background }]}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1511497584788-876760111969?w=800&q=80' }}
            style={styles.fullscreenBackground}
            imageStyle={styles.backgroundImageStyle}
          >
            <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.90)' : 'rgba(255, 255, 255, 0.90)' }]} />
          </ImageBackground>

          <View style={styles.fullscreenHeader}>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.card }]}
              onPress={() => setShowFullscreenPerformance(false)}
            >
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.fullscreenContent}>
            {profile && (
              <View 
                ref={shareViewRef}
                style={styles.fullscreenPerformanceCard}
                collapsable={false}
              >
                <View style={[styles.shareCardBackground, { backgroundColor: colors.card }]}>
                  <View style={styles.fullscreenCardHeader}>
                    <View style={[
                      styles.fullscreenAvatarContainer,
                      {
                        borderWidth: frameStyle ? frameStyle.borderWidth : 3,
                        borderColor: frameStyle ? frameStyle.borderColor : colors.primary,
                      }
                    ]}>
                      <Text style={styles.fullscreenAvatarEmoji}>{getAvatarEmoji()}</Text>
                    </View>
                    <Text style={[styles.fullscreenCardName, { color: colors.text }]}>
                      {profile.name}
                    </Text>
                    <Text style={[styles.fullscreenCardSubtitle, { color: colors.textSecondary }]}>
                      {profile.province} • {profile.experienceLevel}
                    </Text>
                  </View>

                  <View style={[styles.fullscreenStatsSection, { backgroundColor: colors.highlight }]}>
                    <Text style={[styles.fullscreenSectionTitle, { color: colors.text }]}>
                      Overall Performance
                    </Text>
                    <View style={styles.fullscreenStatsGrid}>
                      <View style={styles.fullscreenStatItem}>
                        <Text style={[styles.fullscreenStatValue, { color: colors.primary }]}>
                          {formatLargeNumber(personalBest)}
                        </Text>
                        <Text style={[styles.fullscreenStatLabel, { color: colors.textSecondary }]}>
                          Personal Best
                        </Text>
                      </View>
                      <View style={styles.fullscreenStatItem}>
                        <Text style={[styles.fullscreenStatValue, { color: colors.secondary }]}>
                          {formatLargeNumber(Math.round(averageTreesPerDay))}
                        </Text>
                        <Text style={[styles.fullscreenStatLabel, { color: colors.textSecondary }]}>
                          Avg Trees/Day
                        </Text>
                      </View>
                      <View style={styles.fullscreenStatItem}>
                        <Text style={[styles.fullscreenStatValue, { color: colors.accent }]}>
                          {formatLargeNumber(totalTrees)}
                        </Text>
                        <Text style={[styles.fullscreenStatLabel, { color: colors.textSecondary }]}>
                          Total Trees
                        </Text>
                      </View>
                      <View style={styles.fullscreenStatItem}>
                        <Text style={[styles.fullscreenStatValue, { color: colors.primary }]}>
                          {totalDays}
                        </Text>
                        <Text style={[styles.fullscreenStatLabel, { color: colors.textSecondary }]}>
                          Planting Days
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.fullscreenStatsSection, { backgroundColor: colors.highlight }]}>
                    <Text style={[styles.fullscreenSectionTitle, { color: colors.text }]}>
                      Today&apos;s Performance
                    </Text>
                    <View style={styles.fullscreenStatsGrid}>
                      <View style={styles.fullscreenStatItem}>
                        <Text style={[styles.fullscreenStatValue, { color: colors.secondary }]}>
                          {todayTrees}
                        </Text>
                        <Text style={[styles.fullscreenStatLabel, { color: colors.textSecondary }]}>
                          Trees Planted
                        </Text>
                      </View>
                      <View style={styles.fullscreenStatItem}>
                        <Text style={[styles.fullscreenStatValue, { color: colors.primary }]}>
                          {todayHours}
                        </Text>
                        <Text style={[styles.fullscreenStatLabel, { color: colors.textSecondary }]}>
                          Hours Worked
                        </Text>
                      </View>
                      <View style={styles.fullscreenStatItem}>
                        <Text style={[styles.fullscreenStatValue, { color: colors.accent }]}>
                          {todayRate.toFixed(0)}
                        </Text>
                        <Text style={[styles.fullscreenStatLabel, { color: colors.textSecondary }]}>
                          Trees/Hour
                        </Text>
                      </View>
                      <View style={styles.fullscreenStatItem}>
                        <Text style={[styles.fullscreenStatValue, { color: colors.secondary }]}>
                          {personalBest > 0 ? ((todayTrees / personalBest) * 100).toFixed(0) : 0}%
                        </Text>
                        <Text style={[styles.fullscreenStatLabel, { color: colors.textSecondary }]}>
                          vs PB
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.shareFooter}>
                    <Text style={[styles.shareFooterText, { color: colors.textSecondary }]}>
                      🌲 Tree Planting Tracker
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.fullscreenShareButton, { backgroundColor: colors.primary }]}
              onPress={handleShareStats}
            >
              <IconSymbol
                ios_icon_name="square.and.arrow.up"
                android_material_icon_name="share"
                size={24}
                color="#FFFFFF"
              />
              <Text style={styles.fullscreenShareButtonText}>Share Stats</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
  },
  overviewItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(52, 152, 219, 0.05)',
    borderRadius: 12,
  },
  overviewLabel: {
    fontSize: 12,
    marginTop: 8,
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
  speciesLegend: {
    marginTop: 16,
    width: '100%',
  },
  speciesLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  speciesLegendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  speciesLegendText: {
    fontSize: 13,
    flex: 1,
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
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
  showMoreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  performanceCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.2)',
    elevation: 8,
    overflow: 'hidden',
  },
  performanceCardGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.1,
  },
  performanceCardContent: {
    position: 'relative',
    zIndex: 1,
  },
  performanceCardHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  performanceAvatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    marginBottom: 12,
  },
  performanceAvatarEmoji: {
    fontSize: 48,
  },
  performanceCardName: {
    fontSize: 24,
    fontWeight: '800',
  },
  performanceCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  performanceCardStat: {
    alignItems: 'center',
    flex: 1,
  },
  performanceCardStatLabel: {
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  performanceCardStatValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  performanceCardStatUnit: {
    fontSize: 11,
  },
  performanceCardDivider: {
    width: 1,
    height: 60,
    marginHorizontal: 8,
  },
  performanceCardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  performanceCardButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
  performanceCardButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
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
  fullscreenContainer: {
    flex: 1,
  },
  fullscreenBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  fullscreenHeader: {
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'flex-end',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
  fullscreenContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  fullscreenPerformanceCard: {
    alignItems: 'center',
  },
  shareCardBackground: {
    borderRadius: 24,
    padding: 32,
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.2)',
    elevation: 8,
  },
  fullscreenCardHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  fullscreenAvatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    marginBottom: 16,
  },
  fullscreenAvatarEmoji: {
    fontSize: 72,
  },
  fullscreenCardName: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
  },
  fullscreenCardSubtitle: {
    fontSize: 16,
  },
  fullscreenStatsSection: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  fullscreenSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  fullscreenStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  fullscreenStatItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
  },
  fullscreenStatValue: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 8,
  },
  fullscreenStatLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  shareFooter: {
    alignItems: 'center',
    marginTop: 16,
  },
  shareFooterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fullscreenShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 12,
    marginTop: 16,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
    elevation: 6,
  },
  fullscreenShareButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
