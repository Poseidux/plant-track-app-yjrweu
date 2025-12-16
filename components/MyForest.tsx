
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity, AppState, AppStateStatus } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useThemeContext } from '@Perfect! Now I have a complete understanding of the app. Let me implement all the fixes requested:

## Summary of Issues to Fix:

1. **Forest Animation Performance**: Pause when unfocused/backgrounded, optimize rendering, add low-power mode
2. **Forest Data Bug**: Season Forest and Career Forest show wrong/unchanging tree counts
3. **Theme Change**: Remove default dark theme, make light mode the default
4. **Performance Review**: Trees per hour/minute not updating
5. **Restore Missing Graphs**: Add back removed graphs and features

Let me implement these fixes:

<write file="components/MyForest.tsx">
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity, AppState, AppStateStatus } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { TreePlantingLog } from '@/types/TreePlanting';
import { StorageService } from '@/utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MyForestProps {
  treeLogs: TreePlantingLog[];
}

const ANIMATION_DISABLED_KEY = '@forest_animation_disabled';

// Memoized star component with stable props
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
  const [lowPowerMode, setLowPowerMode] = useState(false);
  
  const isFocused = useIsFocused();
  const dayNightProgress = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const isMountedRef = useRef(true);
  const appState = useRef(AppState.currentState);
  const lastInteractionRef = useRef(Date.now());
  const interactionCheckTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      console.log('MyForest unmounting - cleaning up animation');
      isMountedRef.current = false;
      stopAnimation();
      if (interactionCheckTimerRef.current) {
        clearInterval(interactionCheckTimerRef.current);
        interactionCheckTimerRef.current = null;
      }
    };
  }, []);

  // Monitor app state to pause animation when app is in background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [animationDisabled]);

  // Monitor screen focus to pause animation when screen is not visible
  useEffect(() => {
    console.log('MyForest screen focus changed:', isFocused);
    if (!isFocused) {
      stopAnimation();
    } else if (!animationDisabled && appState.current === 'active' && isMountedRef.current) {
      startDayNightCycle();
    }
  }, [isFocused, animationDisabled]);

  // Low power mode: detect rapid interactions and pause animation temporarily
  useEffect(() => {
    interactionCheckTimerRef.current = setInterval(() => {
      const timeSinceLastInteraction = Date.now() - lastInteractionRef.current;
      
      // If there was interaction in the last 2 seconds, enable low power mode
      if (timeSinceLastInteraction < 2000 && !lowPowerMode) {
        console.log('Enabling low power mode due to rapid interactions');
        setLowPowerMode(true);
        stopAnimation();
      } else if (timeSinceLastInteraction >= 2000 && lowPowerMode) {
        console.log('Disabling low power mode - interactions slowed down');
        setLowPowerMode(false);
        if (isFocused && !animationDisabled && appState.current === 'active' && isMountedRef.current) {
          startDayNightCycle();
        }
      }
    }, 500);

    return () => {
      if (interactionCheckTimerRef.current) {
        clearInterval(interactionCheckTimerRef.current);
        interactionCheckTimerRef.current = null;
      }
    };
  }, [lowPowerMode, isFocused, animationDisabled]);

  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    console.log('App state changed:', appState.current, '->', nextAppState);
    
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to foreground
      if (!animationDisabled && isFocused && !lowPowerMode && isMountedRef.current) {
        console.log('Resuming animation - app active');
        startDayNightCycle();
      }
    } else if (nextAppState.match(/inactive|background/)) {
      // App has gone to background - pause animation
      console.log('Pausing animation - app backgrounded');
      stopAnimation();
    }
    appState.current = nextAppState;
  }, [animationDisabled, isFocused, lowPowerMode]);

  useEffect(() => {
    generateForests();
    loadAnimationPreference();
  }, [treeLogs]);

  useEffect(() => {
    if (!animationDisabled && !lowPowerMode && isFocused && isMountedRef.current && appState.current === 'active') {
      startDayNightCycle();
    } else {
      stopAnimation();
    }
    
    return () => {
      stopAnimation();
    };
  }, [animationDisabled, lowPowerMode, isFocused]);

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
    dayNightProgress.stopAnimation();
  }, [dayNightProgress]);

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
    
    stopAnimation();
    
    if (isMountedRef.current) {
      setAnimationDisabled(newValue);
    }
    
    try {
      await AsyncStorage.setItem(ANIMATION_DISABLED_KEY, newValue.toString());
    } catch (error) {
      console.error('Error saving animation preference:', error);
    }
  }, [animationDisabled, stopAnimation]);

  const startDayNightCycle = useCallback(() => {
    if (!isMountedRef.current || appState.current !== 'active' || !isFocused) {
      console.log('Skipping animation start - conditions not met');
      return;
    }
    
    console.log('Starting day/night cycle animation');
    
    // Stop any existing animation
    stopAnimation();
    
    // Reset to start (day)
    dayNightProgress.setValue(0);
    
    // Use native driver for better performance where possible
    animationRef.current = Animated.loop(
      Animated.sequence([
        // Fade from day (0) to night (0.5) over 15 seconds with smooth easing
        Animated.timing(dayNightProgress, {
          toValue: 0.5,
          duration: 15000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false, // Can't use native driver for backgroundColor
        }),
        // Fade from night (0.5) to day (1) over 15 seconds with smooth easing
        Animated.timing(dayNightProgress, {
          toValue: 1,
          duration: 15000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
      {
        resetBeforeIteration: true,
      }
    );
    
    if (isMountedRef.current) {
      animationRef.current.start();
    }
  }, [dayNightProgress, stopAnimation, isFocused]);

  const generateForests = useCallback(async () => {
    try {
      const activeSeason = await StorageService.getActiveSeason();
      
      // FIXED: Calculate Season Forest from current season logs only
      let seasonTotal = 0;
      if (activeSeason) {
        const seasonLogs = await StorageService.getSeasonTreeLogs(activeSeason.id);
        seasonTotal = seasonLogs.reduce((sum, log) => sum + log.totalTrees, 0);
        console.log('Season Forest total:', seasonTotal, 'from', seasonLogs.length, 'logs');
      } else {
        seasonTotal = treeLogs.reduce((sum, log) => sum + log.totalTrees, 0);
        console.log('Season Forest total (no active season):', seasonTotal);
      }
      
      // FIXED: Calculate Career Forest from ALL seasons correctly
      const allSeasons = await StorageService.getSeasons();
      let careerTotal = 0;
      
      for (const season of allSeasons) {
        const seasonLogs = await StorageService.getSeasonTreeLogs(season.id);
        const seasonSum = seasonLogs.reduce((sum, log) => sum + log.totalTrees, 0);
        careerTotal += seasonSum;
        console.log(`Career Forest - Season ${season.name}: ${seasonSum} trees`);
      }
      
      // If no seasons exist, use current logs
      if (careerTotal === 0) {
        careerTotal = treeLogs.reduce((sum, log) => sum + log.totalTrees, 0);
        console.log('Career Forest total (no seasons):', careerTotal);
      } else {
        console.log('Career Forest total (all seasons):', careerTotal);
      }
      
      // Each tree icon represents 1000 trees for season, 10000 for career
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
        console.log('Forest updated - Season:', seasonTreeArray.length, 'Career:', careerTreeArray.length);
      }
    } catch (error) {
      console.error('Error generating forests:', error);
    }
  }, [treeLogs]);

  // Track user interactions for low power mode
  const handleUserInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now();
  }, []);

  // Memoize stars to prevent recreation - stable reference
  const stars = useMemo(() => {
    const starArray = [];
    // Reduce star count for better performance
    for (let i = 0; i < 20; i++) {
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
  }, []); // Empty deps - only create once

  // Memoize star opacity interpolation
  const starOpacity = useMemo(() => 
    dayNightProgress.interpolate({
      inputRange: [0, 0.25, 0.5, 0.75, 1],
      outputRange: [0, 0, 1, 0, 0],
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
          <Text style={[styles.forestTitle, { color: colors.text }]}>🌲 {title} 🌲</Text>
          <View style={[styles.emptyForestCard, { backgroundColor: colors.highlight }]}>
            <Text style={styles.emptyTreeEmoji}>🌲</Text>
            <Text style={[styles.emptyForestText, { color: colors.textSecondary }]}>
              Start planting to grow your forest!
            </Text>
          </View>
        </View>
      );
    }

    const shouldAnimate = showDayNight && !animationDisabled && !lowPowerMode && isFocused && appState.current === 'active';
    
    const backgroundColor = shouldAnimate
      ? dayNightProgress.interpolate({
          inputRange: [0, 0.25, 0.5, 0.75, 1],
          outputRange: [
            '#87CEEB', // Day - sky blue
            '#4A5F7F', // Dusk - darker blue
            '#1a1a2e', // Night - dark blue
            '#4A5F7F', // Dawn - darker blue
            '#87CEEB', // Day - sky blue
          ],
        })
      : colors.highlight;

    return (
      <View style={styles.forestContainer}>
        <Text style={[styles.forestTitle, { color: colors.text }]}>🌲 {title} 🌲</Text>
        <Animated.View 
          style={[
            styles.forestGrid, 
            shouldAnimate
              ? { backgroundColor } 
              : { backgroundColor: colors.highlight }
          ]}
          onTouchStart={handleUserInteraction}
        >
          {shouldAnimate && renderStars()}
          
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
  }, [colors, animationDisabled, lowPowerMode, isFocused, dayNightProgress, renderStars, handleUserInteraction]);

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTreeEmoji}>🌲</Text>
          <Text style={[styles.title, { color: colors.text }]}>My Forest</Text>
          <Text style={styles.headerTreeEmoji}>🌲</Text>
        </View>
        <View style={styles.headerRight}>
          {lowPowerMode && (
            <View style={[styles.lowPowerBadge, { backgroundColor: colors.warning }]}>
              <Text style={styles.lowPowerText}>⚡ Low Power</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.animationToggle, { backgroundColor: animationDisabled ? colors.error : colors.primary }]}
            onPress={toggleAnimation}
          >
            <Text style={styles.animationToggleText}>
              {animationDisabled ? '⏸ Paused' : '▶ Playing'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderForestGrid(seasonTrees, 'Your Season Forest', 1000, true)}
      {renderForestGrid(careerTrees, 'Your Career Forest', 10000, false)}
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return prevProps.treeLogs.length === nextProps.treeLogs.length &&
         prevProps.treeLogs[0]?.id === nextProps.treeLogs[0]?.id;
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
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTreeEmoji: {
    fontSize: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  lowPowerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lowPowerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
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
    textAlign: 'center',
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
