
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { TreePlantingLog } from '@/types/TreePlanting';
import { IconSymbol } from './IconSymbol';
import { StorageService } from '@/utils/storage';

interface MyForestProps {
  treeLogs: TreePlantingLog[];
}

interface BearPosition {
  x: Animated.Value;
  y: Animated.Value;
  isMoving: boolean;
}

export default function MyForest({ treeLogs }: MyForestProps) {
  const { colors } = useThemeContext();
  const [seasonTrees, setSeasonTrees] = useState<string[]>([]);
  const [careerTrees, setCareerTrees] = useState<string[]>([]);
  
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
  }, [treeLogs]);

  useEffect(() => {
    animateBear(brownBear, 0);
    animateBear(blackBear, 1000);
  }, []);

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
      const randomX = Math.random() * 200 - 100;
      const randomY = Math.random() * 40 - 20;
      
      Animated.parallel([
        Animated.timing(bear.x, {
          toValue: randomX,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bear.y, {
          toValue: randomY,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => {
          moveSequence();
        }, 2000);
      });
    };

    setTimeout(() => {
      moveSequence();
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
          
          {showBears && trees.length > 0 && (
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
        <IconSymbol
          ios_icon_name="tree.fill"
          android_material_icon_name="park"
          size={32}
          color={colors.secondary}
        />
        <Text style={[styles.title, { color: colors.text }]}>My Forest</Text>
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
    marginBottom: 12,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
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
