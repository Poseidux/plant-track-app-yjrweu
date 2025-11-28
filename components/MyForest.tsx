
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity, Dimensions } from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { TreePlantingLog } from '@/types/TreePlanting';
import { IconSymbol } from './IconSymbol';
import { StorageService } from '@/utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MyForestProps {
  treeLogs: TreePlantingLog[];
}

const ANIMATION_DISABLED_KEY = '@forest_animation_disabled';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function MyForest({ treeLogs }: MyForestProps) {
  const { colors } = useThemeContext();
  const [seasonTrees, setSeasonTrees] = useState<string[]>([]);
  const [careerTrees, setCareerTrees] = useState<string[]>([]);
  const [animationDisabled, setAnimationDisabled] = useState(false);
  
  const dayNightProgress = useRef(new Animated.Value(0)).current;
  const animationTimeouts = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    generateForests();
    loadAnimationPreference();
    
    return () => {
      animationTimeouts.current.forEach(timeout => clearTimeout(timeout));
      animationTimeouts.current = [];
    };
  }, [treeLogs]);

  useEffect(() => {
    if (!animationDisabled) {
      startDayNightCycle();
    } else {
      animationTimeouts.current.forEach(timeout => clearTimeout(timeout));
      animationTimeouts.current = [];
    }
  }, [animationDisabled]);

  const loadAnimationPreference = async () => {
    try {
      const value = await AsyncStorage.getItem(ANIMATION_DISABLED_KEY);
      if (value !== null) {
        setAnimationDisabled(value === 'true');
      }
    } catch (error) {
      console.error('Error loading animation preference:', error);
    }
  };

  const toggleAnimation = async () => {
    const newValue = !animationDisabled;
    setAnimationDisabled(newValue);
    
    animationTimeouts.current.forEach(timeout => clearTimeout(timeout));
    animationTimeouts.current = [];
    
    try {
      await AsyncStorage.setItem(ANIMATION_DISABLED_KEY, newValue.toString());
    } catch (error) {
      console.error('Error saving animation preference:', error);
    }
  };

  const startDayNightCycle = () => {
    const cycleDuration = 10000;
    
    const animate = () => {
      Animated.sequence([
        Animated.timing(dayNightProgress, {
          toValue: 1,
          duration: cycleDuration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(dayNightProgress, {
          toValue: 0,
          duration: cycleDuration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]).start(() => {
        if (!animationDisabled) {
          animate();
        }
      });
    };

    animate();
  };

  const generateForests = async () => {
    const activeSeason = await StorageService.getActiveSeason();
    
    let seasonTotal = 0;
    if (activeSeason) {
      const seasonLogs = await StorageService.getSeasonTreeLogs(activeSeason.id);
      seasonTotal = seasonLogs.reduce((sum, log) => sum + log.totalTrees, 0);
    } else {
      seasonTotal = treeLogs.reduce((sum, log) => sum + log.totalTrees, 0);
    }
    
    const allSeasons = await StorageService.getSeasons();
    let careerTotal = 0;
    
    for (const season of allSeasons) {
      const seasonLogs = await StorageService.getSeasonTreeLogs(season.id);
      careerTotal += seasonLogs.reduce((sum, log) => sum + log.totalTrees, 0);
    }
    
    if (careerTotal === 0) {
      careerTotal = treeLogs.reduce((sum, log) => sum + log.totalTrees, 0);
    }
    
    const seasonTreeCount = Math.floor(seasonTotal / 1000);
    const careerTreeCount = Math.floor(careerTotal / 10000);

    const seasonTreeArray: string[] = [];
    for (let i = 0; i < Math.min(seasonTreeCount, 100); i++) {
      seasonTreeArray.push('🌲');
    }

    const careerTreeArray: string[] = [];
    for (let i = 0; i < Math.min(careerTreeCount, 100); i++) {
      careerTreeArray.push('🌲');
    }

    setSeasonTrees(seasonTreeArray);
    setCareerTrees(careerTreeArray);
  };

  const renderForestGrid = (trees: string[], title: string, treesPerEmoji: number, showDayNight: boolean = false) => {
    if (trees.length === 0) {
      return (
        <View style={styles.forestContainer}>
          <Text style={[styles.forestTitle, { color: colors.text }]}>{title}</Text>
          <View style={[styles.emptyForestCard, { backgroundColor: colors.highlight }]}>
            <IconSymbol
              ios_icon_name="tree.fill"
              android_material_icon_name="park"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyForestText, { color: colors.textSecondary }]}>
              Start planting to grow your forest!
            </Text>
          </View>
        </View>
      );
    }

    const backgroundColor = showDayNight && !animationDisabled
      ? dayNightProgress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: ['#87CEEB', '#1a1a2e', '#87CEEB'],
        })
      : colors.highlight;

    return (
      <View style={styles.forestContainer}>
        <Text style={[styles.forestTitle, { color: colors.text }]}>{title}</Text>
        <Animated.View 
          style={[
            styles.forestGrid, 
            showDayNight && !animationDisabled 
              ? { backgroundColor } 
              : { backgroundColor: colors.highlight }
          ]}
        >
          {trees.map((tree, index) => (
            <Text key={`tree-${title}-${index}`} style={styles.treeEmoji}>
              {tree}
            </Text>
          ))}
          
          {showDayNight && !animationDisabled && (
            <Animated.View
              style={[
                styles.sunMoon,
                {
                  opacity: dayNightProgress.interpolate({
                    inputRange: [0, 0.3, 0.7, 1],
                    outputRange: [1, 0, 0, 1],
                  }),
                },
              ]}
            >
              <Text style={styles.sunEmoji}>☀️</Text>
            </Animated.View>
          )}
          
          {showDayNight && !animationDisabled && (
            <Animated.View
              style={[
                styles.sunMoon,
                {
                  opacity: dayNightProgress.interpolate({
                    inputRange: [0, 0.3, 0.7, 1],
                    outputRange: [0, 1, 1, 0],
                  }),
                },
              ]}
            >
              <Text style={styles.moonEmoji}>🌙</Text>
            </Animated.View>
          )}
        </Animated.View>
        <Text style={[styles.forestInfo, { color: colors.textSecondary }]}>
          Each tree emoji represents {treesPerEmoji.toLocaleString()} trees planted
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconSymbol
            ios_icon_name="tree.fill"
            android_material_icon_name="park"
            size={32}
            color={colors.secondary}
          />
          <Text style={[styles.title, { color: colors.text }]}>My Forest</Text>
        </View>
        <TouchableOpacity
          style={[styles.animationToggle, { backgroundColor: animationDisabled ? colors.error : colors.primary }]}
          onPress={toggleAnimation}
        >
          <IconSymbol
            ios_icon_name={animationDisabled ? "pause.fill" : "play.fill"}
            android_material_icon_name={animationDisabled ? "pause" : "play-arrow"}
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.animationToggleText}>
            {animationDisabled ? 'Disabled' : 'Enabled'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Watch your forest grow as you plant more trees! The forest transitions between day and night every 10 seconds.
      </Text>

      {renderForestGrid(seasonTrees, 'Your Season Forest', 1000, true)}
      {renderForestGrid(careerTrees, 'Your Career Forest', 10000, false)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  animationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  animationToggleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  forestContainer: {
    marginBottom: 24,
  },
  forestTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  forestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    borderRadius: 12,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  treeEmoji: {
    fontSize: 24,
    margin: 4,
  },
  sunMoon: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  sunEmoji: {
    fontSize: 32,
  },
  moonEmoji: {
    fontSize: 32,
  },
  forestInfo: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyForestCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  emptyForestText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
});
