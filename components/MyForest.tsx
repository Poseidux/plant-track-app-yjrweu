
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { TreePlantingLog } from '@/types/TreePlanting';
import { StorageService } from '@/utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MyForestProps {
  treeLogs: TreePlantingLog[];
}

const ANIMATION_DISABLED_KEY = '@forest_animation_disabled';

// Memoized star component
const Star = React.memo(({ top, left, size, opacity }: { 
  top: number; 
  left: number; 
  size: number; 
  opacity: Animated.AnimatedInterpolation<number> | number;
}) => (
  <Animated.View
    style={[
      styles.star,
      {
        top: `${top}%`,
        left: `${left}%`,
        width: size,
        height: size,
        opacity,
      },
    ]}
  />
));

Star.displayName = 'Star';

export default React.memo(function MyForest({ treeLogs }: MyForestProps) {
  const { colors } = useThemeContext();
  const [seasonTrees, setSeasonTrees] = useState<string[]>([]);
  const [careerTrees, setCareerTrees] = useState<string[]>([]);
  const [animationDisabled, setAnimationDisabled] = useState(false);
  
  const dayNightProgress = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      console.log('MyForest unmounting - cleaning up animation');
      isMountedRef.current = false;
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
      dayNightProgress.stopAnimation();
    };
  }, []);

  useEffect(() => {
    generateForests();
    loadAnimationPreference();
  }, [treeLogs]);

  useEffect(() => {
    if (!animationDisabled && isMountedRef.current) {
      startDayNightCycle();
    } else {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    }
    
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    };
  }, [animationDisabled]);

  const loadAnimationPreference = useCallback(async () => {
    try {
      const value = await AsyncStorage.getItem(ANIMATION_DISABLED_KEY);
      if (value !== null && isMountedRef.current) {
        setAnimationDisabled(value === 'true');
      }
    } catch (error) {
      console.error('Error loading animation preference:', error);
    }
  }, []);

  const toggleAnimation = useCallback(async () => {
    const newValue = !animationDisabled;
    
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
    
    if (isMountedRef.current) {
      setAnimationDisabled(newValue);
    }
    
    try {
      await AsyncStorage.setItem(ANIMATION_DISABLED_KEY, newValue.toString());
    } catch (error) {
      console.error('Error saving animation preference:', error);
    }
  }, [animationDisabled]);

  const startDayNightCycle = useCallback(() => {
    if (!isMountedRef.current) return;
    
    // Stop any existing animation
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
    
    // Reset to start
    dayNightProgress.setValue(0);
    
    // Create smooth continuous loop: 15s day, 15s night
    const dayDuration = 15000;
    const nightDuration = 15000;
    
    animationRef.current = Animated.loop(
      Animated.sequence([
        // Fade to night
        Animated.timing(dayNightProgress, {
          toValue: 1,
          duration: dayDuration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        // Fade back to day
        Animated.timing(dayNightProgress, {
          toValue: 0,
          duration: nightDuration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );
    
    if (isMountedRef.current) {
      animationRef.current.start();
    }
  }, [dayNightProgress]);

  const generateForests = useCallback(async () => {
    try {
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
        seasonTreeArray.push('tree');
      }

      const careerTreeArray: string[] = [];
      for (let i = 0; i < Math.min(careerTreeCount, 100); i++) {
        careerTreeArray.push('tree');
      }

      if (isMountedRef.current) {
        setSeasonTrees(seasonTreeArray);
        setCareerTrees(careerTreeArray);
      }
    } catch (error) {
      console.error('Error generating forests:', error);
    }
  }, [treeLogs]);

  // Memoize stars to prevent recreation
  const stars = useMemo(() => {
    const starArray = [];
    for (let i = 0; i < 30; i++) {
      const randomTop = Math.random() * 80 + 10;
      const randomLeft = Math.random() * 90 + 5;
      const randomSize = Math.random() * 2 + 1;
      
      starArray.push({
        key: `star-${i}`,
        top: randomTop,
        left: randomLeft,
        size: randomSize,
      });
    }
    return starArray;
  }, []);

  // Memoize star opacity interpolation
  const starOpacity = useMemo(() => 
    dayNightProgress.interpolate({
      inputRange: [0, 0.3, 0.7, 1],
      outputRange: [0, 1, 1, 0],
    })
  , [dayNightProgress]);

  const renderStars = useCallback(() => {
    return stars.map((star) => (
      <Star
        key={star.key}
        top={star.top}
        left={star.left}
        size={star.size}
        opacity={starOpacity}
      />
    ));
  }, [stars, starOpacity]);

  const renderForestGrid = useCallback((trees: string[], title: string, treesPerEmoji: number, showDayNight: boolean = false) => {
    if (trees.length === 0) {
      return (
        <View style={styles.forestContainer}>
          <Text style={[styles.forestTitle, { color: colors.text }]}>🌲 {title}</Text>
          <View style={[styles.emptyForestCard, { backgroundColor: colors.highlight }]}>
            <Text style={styles.emptyTreeEmoji}>🌲</Text>
            <Text style={[styles.emptyForestText, { color: colors.textSecondary }]}>
              Start planting to grow your forest!
            </Text>
          </View>
        </View>
      );
    }

    const backgroundColor = showDayNight && !animationDisabled
      ? dayNightProgress.interpolate({
          inputRange: [0, 0.3, 0.7, 1],
          outputRange: [
            '#87CEEB', // Day - sky blue
            '#1a1a2e', // Night
            '#1a1a2e', // Night
            '#87CEEB', // Day
          ],
        })
      : colors.highlight;

    return (
      <View style={styles.forestContainer}>
        <Text style={[styles.forestTitle, { color: colors.text }]}>🌲 {title}</Text>
        <Animated.View 
          style={[
            styles.forestGrid, 
            showDayNight && !animationDisabled 
              ? { backgroundColor } 
              : { backgroundColor: colors.highlight }
          ]}
        >
          {showDayNight && !animationDisabled && renderStars()}
          
          {trees.map((tree, index) => (
            <View key={`tree-${title}-${index}`} style={styles.treeIcon}>
              <Text style={styles.treeEmoji}>🌲</Text>
            </View>
          ))}
        </Animated.View>
        <Text style={[styles.forestInfo, { color: colors.textSecondary }]}>
          Each tree icon represents {treesPerEmoji.toLocaleString()} trees planted
        </Text>
      </View>
    );
  }, [colors, animationDisabled, dayNightProgress, renderStars]);

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTreeEmoji}>🌲</Text>
          <Text style={[styles.title, { color: colors.text }]}>My Forest</Text>
        </View>
        <TouchableOpacity
          style={[styles.animationToggle, { backgroundColor: animationDisabled ? colors.error : colors.primary }]}
          onPress={toggleAnimation}
        >
          <Text style={styles.animationToggleText}>
            {animationDisabled ? '⏸ Paused' : '▶ Playing'}
          </Text>
        </TouchableOpacity>
      </View>

      {renderForestGrid(seasonTrees, 'Your Season Forest', 1000, true)}
      {renderForestGrid(careerTrees, 'Your Career Forest', 10000, false)}
    </View>
  );
});

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
  headerTreeEmoji: {
    fontSize: 32,
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
  treeIcon: {
    margin: 4,
  },
  treeEmoji: {
    fontSize: 20,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
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
  emptyTreeEmoji: {
    fontSize: 48,
  },
  emptyForestText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
});
