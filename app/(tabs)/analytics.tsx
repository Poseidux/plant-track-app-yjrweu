
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
  Modal,
  Animated,
  Linking,
} from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { StorageService, getLocalDateString } from '@/utils/storage';
import { ShopStorageService } from '@/utils/shopStorage';
import { TreePlantingLog, EarningsLog, ExpenseLog, Achievement, UserProfile } from '@/types/TreePlanting';
import { IconSymbol } from '@/components/IconSymbol';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { checkAchievements } from '@/utils/achievements';
import { formatLargeNumber, formatEarnings } from '@/utils/formatNumber';
import { shareStatsAsImage } from '@/utils/shareStatsImage';
import { AVATAR_FRAMES, PROFILE_ICONS_EMOJIS } from '@/types/Shop';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';

// Memoized performance item component
const PerformanceItem = React.memo(({ 
  icon, 
  androidIcon, 
  color, 
  label, 
  value,
  textColor
}: {
  icon: string;
  androidIcon: string;
  color: string;
  label: string;
  value: string;
  textColor: string;
}) => (
  <View style={styles.overviewItem}>
    <IconSymbol
      ios_icon_name={icon}
      android_material_icon_name={androidIcon}
      size={20}
      color={color}
    />
    <Text style={[styles.overviewLabel, { color: textColor }]}>
      {label}
    </Text>
    <Text style={[styles.overviewValue, { color: textColor }]}>
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
  const normalShareViewRef = useRef(null);
  const [equippedFrame, setEquippedFrame] = useState<string | undefined>();
  const [equippedAvatar, setEquippedAvatar] = useState<string | undefined>();

  const loadData = useCallback(async () => {
    console.log('Analytics - Loading data...');
    const [trees, earnings, expenses, savedAchievements, userProfile, cosmetics] = await Promise.all([
      StorageService.getTreeLogs(),
      StorageService.getEarningsLogs(),
      StorageService.getExpenseLogs(),
      StorageService.getAchievements(),
      StorageService.getUserProfile(),
      ShopStorageService.getUserCosmetics(),
    ]);
    
    console.log('Analytics - Loaded tree logs:', trees.length);
    console.log('Analytics - Tree log dates:', trees.map(log => log.date));
    
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

  useEffect(() => {
    loadData();
    startCardAnimation();
  }, []);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Analytics - Screen focused, reloading data...');
      loadData();
    }, [loadData])
  );

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

  // Helper function to parse time strings to minutes
  const parseTimeToMinutes = useCallback((timeStr: string): number => {
    try {
      const cleanTime = timeStr.trim().replace(/\s+/g, ' ');
      const match = cleanTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      
      if (!match) {
        console.error('Analytics - Invalid time format:', timeStr);
        return 0;
      }
      
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const period = match[3].toUpperCase();
      
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      const totalMinutes = hours * 60 + minutes;
      return totalMinutes;
    } catch (error) {
      console.error('Analytics - Error parsing time:', timeStr, error);
      return 0;
    }
  }, []);

  // Calculate Trees/Hour and Trees/Minute from TODAY'S logs using device's local timezone
  const todayStats = useMemo(() => {
    // Get today's date using device's local timezone
    const todayStr = getLocalDateString();
    
    console.log('Analytics - Looking for logs on date (device local):', todayStr);
    console.log('Analytics - Available log dates:', treeLogs.map(log => log.date));
    
    // Find today's log - match by the log_day field
    const todayLog = treeLogs.find(log => {
      // The log.date should already be in YYYY-MM-DD format (log_day)
      return log.date === todayStr;
    });
    
    if (!todayLog) {
      console.log('Analytics - No log found for today');
      return { 
        treesPerHour: null, 
        treesPerMinute: null,
        treesPlanted: 0,
        hoursWorked: 0,
        comparisonToPB: 0
      };
    }
    
    console.log('Analytics - Found today log:', {
      date: todayLog.date,
      totalTrees: todayLog.totalTrees,
      hasHourlyLogs: !!todayLog.hourlyLogs,
      hourlyLogsCount: todayLog.hourlyLogs?.length || 0
    });
    
    // If no trees planted, return 0 (not null)
    if (todayLog.totalTrees === 0) {
      console.log('Analytics - No trees planted today');
      return { 
        treesPerHour: 0, 
        treesPerMinute: 0,
        treesPlanted: 0,
        hoursWorked: 0,
        comparisonToPB: 0
      };
    }
    
    if (!todayLog.hourlyLogs || todayLog.hourlyLogs.length === 0) {
      console.log('Analytics - No hourly logs for today, using fallback calculation');
      
      // Fallback: Use hours since first log today (if available)
      // Or default to 1 hour to avoid division by zero
      const fallbackHours = 1;
      const tph = todayLog.totalTrees / fallbackHours;
      const tpm = tph / 60;
      
      return { 
        treesPerHour: tph, 
        treesPerMinute: tpm,
        treesPlanted: todayLog.totalTrees,
        hoursWorked: fallbackHours,
        comparisonToPB: personalBest > 0 ? ((todayLog.totalTrees / personalBest) * 100) : 0
      };
    }

    // Calculate total minutes worked today
    let totalMinutes = 0;
    
    for (const hourLog of todayLog.hourlyLogs) {
      const startMinutes = parseTimeToMinutes(hourLog.startTime);
      const endMinutes = parseTimeToMinutes(hourLog.endTime);
      
      if (startMinutes === 0 || endMinutes === 0) {
        console.warn('Analytics - Skipping invalid time range:', hourLog.startTime, '-', hourLog.endTime);
        continue;
      }
      
      let duration = endMinutes - startMinutes;
      
      // Handle overnight shifts
      if (duration < 0) {
        duration += 24 * 60;
      }
      
      // Sanity check: duration should be between 0 and 24 hours
      if (duration > 0 && duration <= 24 * 60) {
        totalMinutes += duration;
        console.log('Analytics - Added duration:', duration, 'minutes from', hourLog.startTime, 'to', hourLog.endTime);
      } else {
        console.warn('Analytics - Invalid duration:', duration, 'minutes');
      }
    }

    console.log('Analytics - Total minutes worked today:', totalMinutes);
    console.log('Analytics - Total trees planted today:', todayLog.totalTrees);

    const hoursWorked = totalMinutes / 60;

    // If no valid time data, use fallback
    if (totalMinutes === 0) {
      console.log('Analytics - No valid time data for today, using fallback');
      const fallbackHours = 1;
      const tph = todayLog.totalTrees / fallbackHours;
      const tpm = tph / 60;
      
      return { 
        treesPerHour: tph, 
        treesPerMinute: tpm,
        treesPlanted: todayLog.totalTrees,
        hoursWorked: fallbackHours,
        comparisonToPB: personalBest > 0 ? ((todayLog.totalTrees / personalBest) * 100) : 0
      };
    }

    // Calculate rates
    const tpm = todayLog.totalTrees / totalMinutes;
    const tph = tpm * 60;

    console.log('Analytics - Calculated rates:', {
      treesPerMinute: tpm,
      treesPerHour: tph,
      hoursWorked: hoursWorked
    });

    return { 
      treesPerHour: tph, 
      treesPerMinute: tpm,
      treesPlanted: todayLog.totalTrees,
      hoursWorked: hoursWorked,
      comparisonToPB: personalBest > 0 ? ((todayLog.totalTrees / personalBest) * 100) : 0
    };
  }, [treeLogs, parseTimeToMinutes, personalBest]);

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
        ? last7.map(log => {
            const logDate = new Date(log.date + 'T00:00:00');
            return logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          })
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
        ? last7.map(log => {
            const logDate = new Date(log.date + 'T00:00:00');
            return logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          })
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
        ? last7.map(log => {
            const logDate = new Date(log.date + 'T00:00:00');
            return logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          })
        : ['No Data'],
      datasets: [{
        data: last7.length > 0 ? last7.map(log => log.averageRate || 0) : [0],
      }],
    };
  }, [treeLogs]);

  const handleShareStats = useCallback(async () => {
    if (normalShareViewRef.current) {
      await shareStatsAsImage(normalShareViewRef.current);
    }
  }, []);

  const handleShareStatsFullscreen = useCallback(async () => {
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

  // Format display values for Trees/Hour and Trees/Minute
  const treesPerHourDisplay = useMemo(() => {
    if (todayStats.treesPerHour === null) return '—';
    if (todayStats.treesPerHour === 0) return '0';
    return todayStats.treesPerHour.toFixed(0);
  }, [todayStats.treesPerHour]);

  const treesPerMinuteDisplay = useMemo(() => {
    if (todayStats.treesPerMinute === null) return '—';
    if (todayStats.treesPerMinute === 0) return '0.0';
    return todayStats.treesPerMinute.toFixed(1);
  }, [todayStats.treesPerMinute]);

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
      value: totalEarnings >= 1000 ? formatEarnings(totalEarnings) : `$${totalEarnings.toFixed(2)}`,
    },
    {
      icon: 'cart.fill',
      androidIcon: 'shopping-cart',
      color: colors.error,
      label: 'Total Expenses',
      value: totalExpenses >= 1000 ? formatEarnings(totalExpenses) : `$${totalExpenses.toFixed(2)}`,
    },
    {
      icon: 'clock.fill',
      androidIcon: 'schedule',
      color: colors.accent,
      label: 'Trees/Hour',
      value: treesPerHourDisplay,
    },
    {
      icon: 'timer',
      androidIcon: 'timer',
      color: colors.warning,
      label: 'Trees/Minute',
      value: treesPerMinuteDisplay,
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
  ], [colors, totalTrees, totalDays, totalEarnings, totalExpenses, treesPerHourDisplay, treesPerMinuteDisplay, averageTreesPerDay, percentageImprovement]);

  const incompleteAchievements = useMemo(() => achievements.filter(a => a.progress < a.target), [achievements]);
  const displayedAchievements = useMemo(() => showAllAchievements 
    ? achievements 
    : incompleteAchievements.slice(0, 10), [showAllAchievements, achievements, incompleteAchievements]);

  const rotateInterpolate = cardRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '5deg'],
  });

  const frameStyle = getFrameStyle();

  const blockTalkQuotes = useMemo(() => [
    { quote: 'The reward for our work is not what we get, but who we become.', author: 'Cam L.' },
    { quote: 'Plant hard and you will become hard. Plant softly and you will remain soft.', author: 'Plantations 3:16' },
    { quote: 'And the Lord Treesus said unto them, "Fret not the double plant, my child, for the checker cannot check them all." Thus were his words spoken.', author: 'Revalations 25:37' },
    { quote: 'In the forest no one can hear you scream', author: 'J.K.' },
    { quote: 'Now the Lord Treesus spoke to them, his faithful, his followers; he doth speak: "What more doth one need?"', author: 'Reflections 69:420' },
    { quote: 'I love the smell of DEET in the morning', author: 'Big Bertha' },
    { quote: 'I saw a cougar and ran. I didn\'t tell the planter next to me because they\'re faster. I regret nothing.', author: 'Fred E. (Bonne Bonne Bonne)' },
    { quote: 'If chocolate milk can\'t fix it, it\'s probably terminal.', author: 'Liam S.' },
    { quote: 'It\'s 5am, it\'s freezing, my ribs have slipped, my wrist is swollen… and somehow the worst part is that the coffee tastes like ass.', author: 'A.K. (Peanut Butter)' },
    { quote: 'After 9 hours on the block, I realized "tree" is just a very honest word. That\'s it. That\'s the thought.', author: 'H.A.' },
    { quote: 'After high-balling you for two shifts, I can confidently say the secret to planting more trees is planting more trees.', author: 'S.A.' },
    { quote: 'If you want to plant 3K, you\'ve gotta walk like your bag-up depends on it.', author: 'Sean K.' },
    { quote: 'I don\'t want revenge. I want balance. That\'s why I\'ll be a state checker.', author: 'S.E.' },
    { quote: 'Yeah, tree planting is pretty fun. My first year I fell into quicksand, got toe tendonitis, fell off a cliff… but hey, I planted 3K on day three.', author: 'E.S.' },
    { quote: 'You\'re a rookie, so here\'s my advice: it always gets worse. Trust me, I\'ve been doing this for three whole years.', author: 'J.K.' },
    { quote: 'Why does your plate look like a prison tray? Should I be worried about your past?', author: 'E.P.' },
    { quote: 'I\'m 90% DEET at this point. A horse wouldn\'t survive this! And these bugs are still completely unbothered!!!', author: 'N.L.' },
    { quote: 'Solid work today, boys. It\'s ripper night; bad ideas are now encouraged.', author: 'L.G.' },
    { quote: 'Rocks hurt. Wasp nests hurt. Super bitch after 10 hours? That changes you.', author: 'B.E. (Guwbs)' },
    { quote: 'I loved today. All I heard was "ting ting ahhhhhh, ting ting ahhhhh" on repeat… all day. I\'m happy now.', author: 'A.K.' },
  ], []);

  // Render avatar with frame correctly
  const renderAvatarWithFrame = () => {
    if (!frameStyle) {
      return (
        <View style={[
          styles.performanceAvatarContainer, 
          { 
            backgroundColor: '#F0F0F0',
            borderWidth: 3,
            borderColor: colors.primary,
          }
        ]}>
          <Text style={styles.performanceAvatarEmoji}>{getAvatarEmoji()}</Text>
        </View>
      );
    }

    if ((frameStyle as any).isGradient) {
      return (
        <View style={styles.performanceAvatarContainer}>
          <LinearGradient
            colors={(frameStyle as any).gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.avatarGradientBorder,
              {
                width: 80,
                height: 80,
                borderRadius: 40,
              }
            ]}
          >
            <View style={[styles.avatarInner, { backgroundColor: '#F0F0F0' }]}>
              <Text style={styles.performanceAvatarEmoji}>{getAvatarEmoji()}</Text>
            </View>
          </LinearGradient>
        </View>
      );
    }

    if ((frameStyle as any).isHalfHalf) {
      return (
        <View style={styles.performanceAvatarContainer}>
          <View style={styles.halfHalfBorderContainer}>
            <View style={[styles.halfTopBorder, { backgroundColor: (frameStyle as any).topColor }]} />
            <View style={[styles.halfBottomBorder, { backgroundColor: (frameStyle as any).bottomColor }]} />
          </View>
          <View style={[styles.avatarInner, { backgroundColor: '#F0F0F0' }]}>
            <Text style={styles.performanceAvatarEmoji}>{getAvatarEmoji()}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[
        styles.performanceAvatarContainer, 
        { 
          backgroundColor: '#F0F0F0',
          borderWidth: frameStyle.borderWidth,
          borderColor: frameStyle.borderColor,
        }
      ]}>
        <Text style={styles.performanceAvatarEmoji}>{getAvatarEmoji()}</Text>
      </View>
    );
  };

  const renderFullscreenAvatarWithFrame = () => {
    if (!frameStyle) {
      return (
        <View style={[
          styles.fullscreenAvatarContainer, 
          { 
            backgroundColor: '#F0F0F0',
            borderWidth: 3,
            borderColor: colors.primary,
          }
        ]}>
          <Text style={styles.fullscreenAvatarEmoji}>{getAvatarEmoji()}</Text>
        </View>
      );
    }

    if ((frameStyle as any).isGradient) {
      return (
        <View style={styles.fullscreenAvatarContainer}>
          <LinearGradient
            colors={(frameStyle as any).gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.avatarGradientBorder,
              {
                width: 120,
                height: 120,
                borderRadius: 60,
              }
            ]}
          >
            <View style={[styles.avatarInner, { backgroundColor: '#F0F0F0', width: 110, height: 110, borderRadius: 55 }]}>
              <Text style={styles.fullscreenAvatarEmoji}>{getAvatarEmoji()}</Text>
            </View>
          </LinearGradient>
        </View>
      );
    }

    if ((frameStyle as any).isHalfHalf) {
      return (
        <View style={styles.fullscreenAvatarContainer}>
          <View style={[styles.halfHalfBorderContainer, { width: 120, height: 120, borderRadius: 60 }]}>
            <View style={[styles.halfTopBorder, { width: 120, height: 60 }]} />
            <View style={[styles.halfBottomBorder, { width: 120, height: 60 }]} />
          </View>
          <View style={[styles.avatarInner, { backgroundColor: '#F0F0F0', width: 110, height: 110, borderRadius: 55 }]}>
            <Text style={styles.fullscreenAvatarEmoji}>{getAvatarEmoji()}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[
        styles.fullscreenAvatarContainer, 
        { 
          backgroundColor: '#F0F0F0',
          borderWidth: frameStyle.borderWidth,
          borderColor: frameStyle.borderColor,
        }
      ]}>
        <Text style={styles.fullscreenAvatarEmoji}>{getAvatarEmoji()}</Text>
      </View>
    );
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
                textColor={colors.text}
              />
            ))}
          </View>
          
          {treeLogs.length === 0 && (
            <View style={[styles.emptyHint, { backgroundColor: colors.highlight }]}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.emptyHintText, { color: colors.text }]}>
                Start logging trees in the Log tab to see your performance metrics update!
              </Text>
            </View>
          )}
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
            <View 
              ref={normalShareViewRef}
              style={styles.performanceCardContent}
              collapsable={false}
            >
              <View style={styles.performanceCardHeader}>
                {renderAvatarWithFrame()}
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
            <View style={styles.tipItem}>
              <Text style={[styles.tipNumber, { color: colors.primary }]}>1</Text>
              <Text style={[styles.tipText, { color: colors.text }]}>
                Check out{' '}
                <Text 
                  style={[styles.tipLink, { color: colors.primary }]}
                  onPress={() => Linking.openURL('https://www.reddit.com/r/treeplanting/')}
                >
                  r/treeplanting
                </Text>
                {' '}— a whole subreddit dedicated to tree planting with everything you could need.
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={[styles.tipNumber, { color: colors.primary }]}>2</Text>
              <Text style={[styles.tipText, { color: colors.text }]}>
                Visit King Kong Reforestation — even more information and resources there.
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={[styles.tipNumber, { color: colors.primary }]}>3</Text>
              <Text style={[styles.tipText, { color: colors.text }]}>
                Follow steps 1 and 2. Seriously, between the two, you&apos;ll have all the information you&apos;ll ever need.
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.blockTalkCard, { backgroundColor: colors.card }]}>
          <View style={styles.blockTalkHeader}>
            <IconSymbol
              ios_icon_name="quote.bubble.fill"
              android_material_icon_name="format-quote"
              size={28}
              color={colors.secondary}
            />
            <Text style={[styles.blockTalkTitle, { color: colors.text }]}>
              Block Talk
            </Text>
          </View>
          
          <Text style={[styles.blockTalkSubtitle, { color: colors.textSecondary }]}>
            Dirty Hands, Smart Words
          </Text>
          
          <Text style={[styles.blockTalkDescription, { color: colors.textSecondary }]}>
            If you have "Block Talk" you&apos;d like to see featured here, post it on the Reddit tree planting page and include the keywords "Sylvi Plus" and "Block Talk." Every six months, we&apos;ll update the app with your submissions.
          </Text>
          
          <View style={styles.quotesList}>
            {blockTalkQuotes.map((item, index) => (
              <View key={`quote-${index}`} style={[styles.quoteItem, { backgroundColor: colors.highlight }]}>
                <IconSymbol
                  ios_icon_name="quote.opening"
                  android_material_icon_name="format-quote"
                  size={20}
                  color={colors.primary}
                  style={styles.quoteIcon}
                />
                <View style={styles.quoteContent}>
                  <Text style={[styles.quoteText, { color: colors.text }]}>
                    {item.quote}
                  </Text>
                  <Text style={[styles.quoteAuthor, { color: colors.textSecondary }]}>
                    ~ {item.author}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          
          <View style={[styles.thankYouSection, { backgroundColor: colors.highlight }]}>
            <Text style={[styles.thankYouText, { color: colors.textSecondary }]}>
              *A huge thank you to everyone in my Ontario camp for an incredible season — you were all amazing! Special shout-outs to Kovacs, Cam, Anjeli, Hannah, Fred, Syd, Ned, Gabe, Alec, Declan, and Liam — you all made it unforgettable.*
            </Text>
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
                    {renderFullscreenAvatarWithFrame()}
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
                          {formatLargeNumber(todayStats.treesPlanted)}
                        </Text>
                        <Text style={[styles.fullscreenStatLabel, { color: colors.textSecondary }]}>
                          Trees Planted
                        </Text>
                      </View>
                      <View style={styles.fullscreenStatItem}>
                        <Text style={[styles.fullscreenStatValue, { color: colors.primary }]}>
                          {todayStats.hoursWorked > 0 ? todayStats.hoursWorked.toFixed(1) : '—'}
                        </Text>
                        <Text style={[styles.fullscreenStatLabel, { color: colors.textSecondary }]}>
                          Hours Worked
                        </Text>
                      </View>
                      <View style={styles.fullscreenStatItem}>
                        <Text style={[styles.fullscreenStatValue, { color: colors.accent }]}>
                          {treesPerHourDisplay}
                        </Text>
                        <Text style={[styles.fullscreenStatLabel, { color: colors.textSecondary }]}>
                          Trees/Hour
                        </Text>
                      </View>
                      <View style={styles.fullscreenStatItem}>
                        <Text style={[styles.fullscreenStatValue, { color: colors.secondary }]}>
                          {todayStats.comparisonToPB > 0 ? todayStats.comparisonToPB.toFixed(0) : '—'}%
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
              onPress={handleShareStatsFullscreen}
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
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  emptyHintText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
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
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  avatarGradientBorder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },
  avatarInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halfHalfBorderContainer: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  halfTopBorder: {
    width: 80,
    height: 40,
  },
  halfBottomBorder: {
    width: 80,
    height: 40,
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
    fontSize: 11,
    marginBottom: 8,
    textAlign: 'center',
  },
  performanceCardStatValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  performanceCardStatUnit: {
    fontSize: 10,
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
  tipLink: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  blockTalkCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  blockTalkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  blockTalkTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  blockTalkSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  blockTalkDescription: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  quotesList: {
    gap: 16,
  },
  quoteItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  quoteIcon: {
    marginTop: 2,
  },
  quoteContent: {
    flex: 1,
  },
  quoteText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  quoteAuthor: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  thankYouSection: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
  },
  thankYouText: {
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
    textAlign: 'center',
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
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
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
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
  },
  fullscreenStatLabel: {
    fontSize: 13,
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
