
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { TreePlantingLog } from '@/types/TreePlanting';
import { StorageService } from '@/utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MyForestProps {
  treeLogs: TreePlantingLog[];
}

const BACKGROUND_MODE_KEY = '@forest_background_mode';

const MyForest = React.memo(function MyForest({ treeLogs }: MyForestProps) {
  const { colors } = useThemeContext();
  const [seasonTrees, setSeasonTrees] = useState<string[]>([]);
  const [careerTrees, setCareerTrees] = useState<string[]>([]);
  const [backgroundMode, setBackgroundMode] = useState<'day' | 'night'>('day');
  
  const isMountedRef = React.useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      console.log('MyForest unmounting');
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    generateForests();
    loadBackgroundMode();
  }, [treeLogs]);

  const loadBackgroundMode = useCallback(async () => {
    try {
      const value = await AsyncStorage.getItem(BACKGROUND_MODE_KEY);
      if (value !== null && isMountedRef.current) {
        setBackgroundMode(value as 'day' | 'night');
      }
    } catch (error) {
      console.error('Error loading background mode:', error);
    }
  }, []);

  const toggleBackgroundMode = useCallback(async (value: boolean) => {
    const newMode = value ? 'night' : 'day';
    
    if (isMountedRef.current) {
      setBackgroundMode(newMode);
    }
    
    try {
      await AsyncStorage.setItem(BACKGROUND_MODE_KEY, newMode);
    } catch (error) {
      console.error('Error saving background mode:', error);
    }
  }, []);

  const generateForests = useCallback(async () => {
    try {
      const activeSeason = await StorageService.getActiveSeason();
      
      // Calculate Season Forest from current season logs only
      let seasonTotal = 0;
      if (activeSeason) {
        const seasonLogs = await StorageService.getSeasonTreeLogs(activeSeason.id);
        seasonTotal = seasonLogs.reduce((sum, log) => sum + log.totalTrees, 0);
        console.log('Season Forest total:', seasonTotal, 'from', seasonLogs.length, 'logs');
      } else {
        seasonTotal = treeLogs.reduce((sum, log) => sum + log.totalTrees, 0);
        console.log('Season Forest total (no active season):', seasonTotal);
      }
      
      // Calculate Career Forest from ALL seasons correctly
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

  const renderStars = useCallback(() => {
    if (backgroundMode !== 'night') return null;
    
    return stars.map((star) => (
      <View
        key={star.key}
        style={[
          styles.star,
          {
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: star.size,
            height: star.size,
          },
        ]}
      />
    ));
  }, [stars, backgroundMode]);

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

    const backgroundColor = showDayNight
      ? (backgroundMode === 'day' ? '#87CEEB' : '#1a1a2e')
      : colors.highlight;

    return (
      <View style={styles.forestContainer}>
        <Text style={[styles.forestTitle, { color: colors.text }]}>🌲 {title} 🌲</Text>
        <View 
          style={[
            styles.forestGrid, 
            { backgroundColor }
          ]}
        >
          {showDayNight && renderStars()}
          
          {trees.map((tree, index) => (
            <View key={`tree-${title}-${index}`} style={styles.treeIcon}>
              <Text style={styles.treeEmoji}>🌲</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.forestInfo, { color: colors.textSecondary }]}>
          Each tree icon represents {treesPerEmoji.toLocaleString()} trees planted
        </Text>
      </View>
    );
  }, [colors, backgroundMode, renderStars]);

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTreeEmoji}>🌲</Text>
          <Text style={[styles.title, { color: colors.text }]}>My Forest</Text>
          <Text style={styles.headerTreeEmoji}>🌲</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.toggleContainer}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>☀️</Text>
            <Switch
              value={backgroundMode === 'night'}
              onValueChange={toggleBackgroundMode}
              trackColor={{ false: '#FFD700', true: '#4A5F7F' }}
              thumbColor="#FFFFFF"
            />
            <Text style={[styles.toggleLabel, { color: colors.text }]}>🌙</Text>
          </View>
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

MyForest.displayName = 'MyForest';

export default MyForest;

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
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleLabel: {
    fontSize: 16,
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
