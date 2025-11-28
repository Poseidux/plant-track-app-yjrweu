
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { TreePlantingLog } from '@/types/TreePlanting';
import { IconSymbol } from './IconSymbol';
import { StorageService } from '@/utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MyForestProps {
  treeLogs: TreePlantingLog[];
}

interface BearPosition {
  x: Animated.Value;
  y: Animated.Value;
  isMoving: boolean;
}

const ANIMATION_DISABLED_KEY = '@bear_animation_disabled';

export default function MyForest({ treeLogs }: MyForestProps) {
  const { colors } = useThemeContext();
  const [seasonTrees, setSeasonTrees] = useState<string[]>([]);
  const [careerTrees, setCareerTrees] = useState<string[]>([]);
  const [animationDisabled, setAnimationDisabled] = useState(false);
  
  const [brownBear] = useState<BearPosition>({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    isMoving: false,
  });
  
  const [blackBear] = useState<BearPosition>({
    x: new Animated.Value(50),
    y: new Animated.Value(20),
    isMoving: false,
  });

  useEffect(() => {
    generateForests();
    loadAnimationPreference();
  }, [treeLogs]);

  useEffect(() => {
    if (!animationDisabled) {
      animateBear(brownBear, 0);
      animateBear(blackBear, 1500);
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
    try {
      await AsyncStorage.setItem(ANIMATION_DISABLED_KEY, newValue.toString());
    } catch (error) {
      console.error('Error saving animation preference:', error);
    }
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

  const animateBear = (bear: BearPosition, delay: number) => {
    const moveSequence = () => {
      // Constrain movement to stay within the forest area
      // Reduced range to keep bears within tree boundaries
      const randomX = Math.random() * 80 - 40; // Reduced from 120 to 80
      const randomY = Math.random() * 20 - 10; // Reduced from 30 to 20
      
      Animated.parallel([
        Animated.timing(bear.x, {
          toValue: randomX,
          duration: 6000, // Increased from 4000 to 6000 (even slower)
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bear.y, {
          toValue: randomY,
          duration: 6000, // Increased from 4000 to 6000 (even slower)
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => {
          if (!animationDisabled) {
            moveSequence();
          }
        }, 2000);
      });
    };

    setTimeout(() => {
      if (!animationDisabled) {
        moveSequence();
      }
    }, delay);
  };

  const renderForestGrid = (trees: string[], title: string, treesPerEmoji: number, showBears: boolean = false) => {
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

    return (
      <View style={styles.forestContainer}>
        <Text style={[styles.forestTitle, { color: colors.text }]}>{title}</Text>
        <View style={[styles.forestGrid, { backgroundColor: colors.highlight }]}>
          {trees.map((tree, index) => (
            <Text key={`tree-${title}-${index}`} style={styles.treeEmoji}>
              {tree}
            </Text>
          ))}
          
          {showBears && trees.length > 0 && !animationDisabled && (
            <>
              <Animated.Text
                style={[
                  styles.bearEmoji,
                  {
                    transform: [
                      { translateX: brownBear.x },
                      { translateY: brownBear.y },
                    ],
                  },
                ]}
              >
                🐻
              </Animated.Text>
              
              <Animated.Text
                style={[
                  styles.bearEmoji,
                  {
                    transform: [
                      { translateX: blackBear.x },
                      { translateY: blackBear.y },
                    ],
                  },
                ]}
              >
                🐻‍❄️
              </Animated.Text>
            </>
          )}
        </View>
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
        Watch your forest grow as you plant more trees! Each tree emoji represents your planting progress.
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
    minHeight: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  treeEmoji: {
    fontSize: 24,
    margin: 4,
  },
  bearEmoji: {
    fontSize: 16,
    position: 'absolute',
    top: 30,
    left: 50,
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
