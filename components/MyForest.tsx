
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
  currentX: number;
  currentY: number;
}

const ANIMATION_DISABLED_KEY = '@bear_animation_disabled';
const BEAR_POSITIONS_KEY = '@bear_positions';

export default function MyForest({ treeLogs }: MyForestProps) {
  const { colors } = useThemeContext();
  const [seasonTrees, setSeasonTrees] = useState<string[]>([]);
  const [careerTrees, setCareerTrees] = useState<string[]>([]);
  const [animationDisabled, setAnimationDisabled] = useState(false);
  
  const [brownBear1] = useState<BearPosition>({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    isMoving: false,
    currentX: 0,
    currentY: 0,
  });
  
  const [brownBear2] = useState<BearPosition>({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    isMoving: false,
    currentX: 0,
    currentY: 0,
  });

  const [brownBear3] = useState<BearPosition>({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    isMoving: false,
    currentX: 0,
    currentY: 0,
  });
  
  const [brownBear4] = useState<BearPosition>({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    isMoving: false,
    currentX: 0,
    currentY: 0,
  });

  useEffect(() => {
    generateForests();
    loadAnimationPreference();
    loadBearPositions();
  }, [treeLogs]);

  useEffect(() => {
    if (!animationDisabled) {
      animateBear(brownBear1, 0);
      animateBear(brownBear2, 1500);
      animateBear(brownBear3, 3000);
      animateBear(brownBear4, 4500);
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

  const loadBearPositions = async () => {
    try {
      const value = await AsyncStorage.getItem(BEAR_POSITIONS_KEY);
      if (value !== null) {
        const positions = JSON.parse(value);
        brownBear1.x.setValue(positions.bear1.x);
        brownBear1.y.setValue(positions.bear1.y);
        brownBear1.currentX = positions.bear1.x;
        brownBear1.currentY = positions.bear1.y;

        brownBear2.x.setValue(positions.bear2.x);
        brownBear2.y.setValue(positions.bear2.y);
        brownBear2.currentX = positions.bear2.x;
        brownBear2.currentY = positions.bear2.y;

        brownBear3.x.setValue(positions.bear3.x);
        brownBear3.y.setValue(positions.bear3.y);
        brownBear3.currentX = positions.bear3.x;
        brownBear3.currentY = positions.bear3.y;

        brownBear4.x.setValue(positions.bear4.x);
        brownBear4.y.setValue(positions.bear4.y);
        brownBear4.currentX = positions.bear4.x;
        brownBear4.currentY = positions.bear4.y;
      } else {
        const initialPositions = {
          bear1: { x: -80, y: -60 },
          bear2: { x: 100, y: 40 },
          bear3: { x: -120, y: 80 },
          bear4: { x: 140, y: -40 },
        };
        brownBear1.x.setValue(initialPositions.bear1.x);
        brownBear1.y.setValue(initialPositions.bear1.y);
        brownBear1.currentX = initialPositions.bear1.x;
        brownBear1.currentY = initialPositions.bear1.y;

        brownBear2.x.setValue(initialPositions.bear2.x);
        brownBear2.y.setValue(initialPositions.bear2.y);
        brownBear2.currentX = initialPositions.bear2.x;
        brownBear2.currentY = initialPositions.bear2.y;

        brownBear3.x.setValue(initialPositions.bear3.x);
        brownBear3.y.setValue(initialPositions.bear3.y);
        brownBear3.currentX = initialPositions.bear3.x;
        brownBear3.currentY = initialPositions.bear3.y;

        brownBear4.x.setValue(initialPositions.bear4.x);
        brownBear4.y.setValue(initialPositions.bear4.y);
        brownBear4.currentX = initialPositions.bear4.x;
        brownBear4.currentY = initialPositions.bear4.y;

        await saveBearPositions();
      }
    } catch (error) {
      console.error('Error loading bear positions:', error);
    }
  };

  const saveBearPositions = async () => {
    try {
      const positions = {
        bear1: { x: brownBear1.currentX, y: brownBear1.currentY },
        bear2: { x: brownBear2.currentX, y: brownBear2.currentY },
        bear3: { x: brownBear3.currentX, y: brownBear3.currentY },
        bear4: { x: brownBear4.currentX, y: brownBear4.currentY },
      };
      await AsyncStorage.setItem(BEAR_POSITIONS_KEY, JSON.stringify(positions));
    } catch (error) {
      console.error('Error saving bear positions:', error);
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
      const randomX = (Math.random() * 400) - 200;
      const randomY = (Math.random() * 200) - 100;
      
      bear.currentX = randomX;
      bear.currentY = randomY;
      
      Animated.parallel([
        Animated.timing(bear.x, {
          toValue: randomX,
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bear.y, {
          toValue: randomY,
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        saveBearPositions();
        setTimeout(() => {
          if (!animationDisabled) {
            moveSequence();
          }
        }, 3000);
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
                      { translateX: brownBear1.x },
                      { translateY: brownBear1.y },
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
                      { translateX: brownBear2.x },
                      { translateY: brownBear2.y },
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
                      { translateX: brownBear3.x },
                      { translateY: brownBear3.y },
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
                      { translateX: brownBear4.x },
                      { translateY: brownBear4.y },
                    ],
                  },
                ]}
              >
                🐻
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
    top: '50%',
    left: '50%',
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
