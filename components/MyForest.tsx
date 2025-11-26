
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { TreePlantingLog } from '@/types/TreePlanting';
import { IconSymbol } from './IconSymbol';
import Svg, { Circle, Rect } from 'react-native-svg';

interface MyForestProps {
  treeLogs: TreePlantingLog[];
}

export default function MyForest({ treeLogs }: MyForestProps) {
  const { colors } = useThemeContext();
  const [seasonForest, setSeasonForest] = useState<number[][]>([]);
  const [careerForest, setCareerForest] = useState<number[][]>([]);

  useEffect(() => {
    generateForests();
  }, [treeLogs]);

  const generateForests = () => {
    const totalTrees = treeLogs.reduce((sum, log) => sum + log.totalTrees, 0);
    const seasonTrees = Math.min(totalTrees, 100000);
    const careerTrees = totalTrees;

    const seasonGrid = generateForestGrid(seasonTrees, 20, 15);
    const careerGrid = generateForestGrid(careerTrees, 30, 25);

    setSeasonForest(seasonGrid);
    setCareerForest(careerGrid);
  };

  const generateForestGrid = (totalTrees: number, cols: number, rows: number): number[][] => {
    const grid: number[][] = [];
    const treesPerCell = Math.ceil(totalTrees / (cols * rows));
    
    for (let i = 0; i < rows; i++) {
      const row: number[] = [];
      for (let j = 0; j < cols; j++) {
        const cellIndex = i * cols + j;
        const treesInCell = Math.min(treesPerCell, Math.max(0, totalTrees - cellIndex * treesPerCell));
        row.push(treesInCell > 0 ? 1 : 0);
      }
      grid.push(row);
    }
    
    return grid;
  };

  const getTreeColor = (hasTree: number) => {
    if (hasTree === 0) return colors.border;
    return colors.secondary;
  };

  const renderForestGrid = (grid: number[][], title: string, zoom: number) => {
    // Check if grid is valid before rendering
    if (!grid || grid.length === 0 || !grid[0] || grid[0].length === 0) {
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

    const screenWidth = Dimensions.get('window').width - 64;
    const cellSize = (screenWidth / grid[0].length) * zoom;
    const gridWidth = grid[0].length * cellSize;
    const gridHeight = grid.length * cellSize;

    return (
      <View style={styles.forestContainer}>
        <Text style={[styles.forestTitle, { color: colors.text }]}>{title}</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.forestScrollContent}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.forestScrollContent}
          >
            <Svg width={gridWidth} height={gridHeight}>
              {grid.map((row, rowIndex) => (
                <React.Fragment key={`row-${rowIndex}`}>
                  {row.map((cell, colIndex) => (
                    <Circle
                      key={`cell-${rowIndex}-${colIndex}`}
                      cx={colIndex * cellSize + cellSize / 2}
                      cy={rowIndex * cellSize + cellSize / 2}
                      r={cellSize / 3}
                      fill={getTreeColor(cell)}
                    />
                  ))}
                </React.Fragment>
              ))}
            </Svg>
          </ScrollView>
        </ScrollView>
        <View style={styles.forestLegend}>
          <View style={styles.forestLegendItem}>
            <View style={[styles.forestLegendDot, { backgroundColor: colors.secondary }]} />
            <Text style={[styles.forestLegendText, { color: colors.textSecondary }]}>Trees Planted</Text>
          </View>
          <View style={styles.forestLegendItem}>
            <View style={[styles.forestLegendDot, { backgroundColor: colors.border }]} />
            <Text style={[styles.forestLegendText, { color: colors.textSecondary }]}>Empty Space</Text>
          </View>
        </View>
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
        Watch your forest grow as you plant more trees! Each dot represents trees you&apos;ve planted.
      </Text>

      {renderForestGrid(seasonForest, 'Your Season Forest', 1)}
      {renderForestGrid(careerForest, 'Your Career Forest', 0.6)}
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
  forestScrollContent: {
    paddingVertical: 8,
  },
  forestLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 12,
  },
  forestLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  forestLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  forestLegendText: {
    fontSize: 12,
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
