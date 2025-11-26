
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ImageBackground,
  Platform,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { StorageService } from '@/utils/storage';
import { TreePlantingLog, EarningsLog, PROVINCES, TREE_SPECIES } from '@/types/TreePlanting';
import { IconSymbol } from '@/components/IconSymbol';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { formatLargeNumber } from '@/utils/formatNumber';
import { APP_THEMES } from '@/constants/Themes';

export default function HomeScreen() {
  const { colors, isDark, selectedTheme, setSelectedTheme, setThemeMode } = useThemeContext();
  const router = useRouter();
  const [treeLogs, setTreeLogs] = useState<TreePlantingLog[]>([]);
  const [earningsLogs, setEarningsLogs] = useState<EarningsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLog, setEditingLog] = useState<TreePlantingLog | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  
  const [editTrees, setEditTrees] = useState('');
  const [editSpecies, setEditSpecies] = useState('');
  const [editProvince, setEditProvince] = useState('');
  const [editLandType, setEditLandType] = useState<'prepped' | 'raw'>('prepped');

  useEffect(() => {
    console.log('HomeScreen mounted');
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('Loading home screen data...');
      const [trees, earnings] = await Promise.all([
        StorageService.getTreeLogs(),
        StorageService.getEarningsLogs(),
      ]);
      console.log('Loaded trees:', trees.length, 'earnings:', earnings.length);
      setTreeLogs(trees);
      setEarningsLogs(earnings);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalTrees = treeLogs.reduce((sum, log) => sum + log.totalTrees, 0);
  const totalEarnings = earningsLogs.reduce((sum, log) => sum + log.amount, 0);
  const totalDays = treeLogs.length;

  const handleEditLog = (log: TreePlantingLog) => {
    setEditingLog(log);
    setEditTrees(log.totalTrees.toString());
    setEditSpecies(log.species);
    setEditProvince(log.province);
    setEditLandType((log.hourlyLogs && log.hourlyLogs[0]?.landType) || 'prepped');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingLog) {
      return;
    }

    if (!editTrees || parseInt(editTrees) <= 0) {
      Alert.alert('Error', 'Please enter a valid number of trees');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const updatedLog: TreePlantingLog = {
      ...editingLog,
      totalTrees: parseInt(editTrees),
      species: editSpecies,
      province: editProvince,
      hourlyLogs: (editingLog.hourlyLogs || []).map(hl => ({
        ...hl,
        landType: editLandType,
      })),
    };

    await StorageService.saveTreeLog(updatedLog);
    await loadData();
    setShowEditModal(false);
    setEditingLog(null);
    Alert.alert('Success', 'Log updated successfully!');
  };

  const handleThemeSelect = async (themeId: string) => {
    const theme = APP_THEMES.find(t => t.id === themeId);
    if (!theme) return;

    Alert.alert(
      'Switch Theme',
      `Are you sure you want to switch to ${theme.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            await setSelectedTheme(themeId);
            if (theme.forcedMode) {
              await setThemeMode(theme.forcedMode);
            }
            setShowThemeMenu(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const getSpeciesBreakdown = () => {
    const speciesCount: { [key: string]: number } = {};
    treeLogs.forEach(log => {
      if (log.hourlyLogs && log.hourlyLogs.length > 0) {
        log.hourlyLogs.forEach(hourlyLog => {
          const species = hourlyLog.species || log.species || 'Unknown';
          speciesCount[species] = (speciesCount[species] || 0) + hourlyLog.treesPlanted;
        });
      } else {
        const species = log.species || 'Unknown';
        speciesCount[species] = (speciesCount[species] || 0) + log.totalTrees;
      }
    });
    return Object.entries(speciesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  const speciesData = getSpeciesBreakdown();
  const chartColors = ['#3498DB', '#2ECC71', '#F39C12', '#E74C3C', '#9B59B6'];

  const pieChartData = speciesData.map(([species, count], index) => ({
    name: species.length > 12 ? species.substring(0, 10) + '...' : species,
    population: count,
    color: chartColors[index % chartColors.length],
    legendFontColor: colors.text,
    legendFontSize: 11,
  }));

  const getEarningsChartData = () => {
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
  };

  const getTreesChartData = () => {
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
  };

  const getDailyRateChartData = () => {
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
  };

  const getRecentActivityLogs = () => {
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000));
    
    return treeLogs
      .filter(log => new Date(log.date) >= fiveDaysAgo)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  };

  const screenWidth = Dimensions.get('window').width;

  const chartConfig = {
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
  };

  const earningsChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: colors.secondary,
    },
  };

  const rateChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => `rgba(243, 156, 18, ${opacity})`,
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: colors.accent,
    },
  };

  console.log('Rendering HomeScreen with colors:', colors);

  const recentActivityLogs = getRecentActivityLogs();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80' }}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.85)' }]} />
      </ImageBackground>
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: colors.card }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowThemeMenu(true);
            }}
          >
            <IconSymbol
              ios_icon_name="line.3.horizontal"
              android_material_icon_name="menu"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>🌲 Tree Planter 🌲</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Track your environmental impact
            </Text>
          </View>
          <View style={styles.menuButtonPlaceholder} />
        </View>

        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/(home)/trees-summary');
            }}
          >
            <IconSymbol
              ios_icon_name="leaf.fill"
              android_material_icon_name="eco"
              size={28}
              color="#FFFFFF"
            />
            <Text style={styles.statNumber}>{formatLargeNumber(totalTrees)}</Text>
            <Text style={styles.statLabel}>Trees Planted</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: colors.secondary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/(home)/earnings-summary');
            }}
          >
            <IconSymbol
              ios_icon_name="dollarsign.circle.fill"
              android_material_icon_name="attach-money"
              size={28}
              color="#FFFFFF"
            />
            <Text style={styles.statNumber}>
              {totalEarnings >= 100000 ? `$${formatLargeNumber(totalEarnings)}` : `$${totalEarnings.toFixed(2)}`}
            </Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: colors.accent }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/(home)/planting-days');
            }}
          >
            <IconSymbol
              ios_icon_name="calendar.badge.clock"
              android_material_icon_name="event"
              size={28}
              color="#FFFFFF"
            />
            <Text style={styles.statNumber}>{totalDays}</Text>
            <Text style={styles.statLabel}>Planting Days</Text>
          </TouchableOpacity>
        </View>

        {earningsLogs.length >= 2 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>💰 Earnings Trend (Last 7 Days)</Text>
            <LineChart
              data={getEarningsChartData()}
              width={screenWidth - 64}
              height={200}
              chartConfig={earningsChartConfig}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {treeLogs.length >= 2 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>🌳 Total Trees Planted (Last 7 Days)</Text>
            <LineChart
              data={getTreesChartData()}
              width={screenWidth - 64}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {treeLogs.length >= 2 && treeLogs.some(log => log.averageRate) && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>⚡ Daily Planting Rate (Last 7 Days)</Text>
            <LineChart
              data={getDailyRateChartData()}
              width={screenWidth - 64}
              height={200}
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
                <View key={`species-legend-${index}-${species}`} style={styles.speciesLegendItem}>
                  <View style={[styles.speciesLegendColor, { backgroundColor: chartColors[index % chartColors.length] }]} />
                  <Text style={[styles.speciesLegendText, { color: colors.text }]} numberOfLines={1}>
                    {species}: {count}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {treeLogs.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <IconSymbol
              ios_icon_name="tree.fill"
              android_material_icon_name="park"
              size={80}
              color={colors.secondary}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Start Your Journey</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Log your first tree planting session to see your progress!
            </Text>
          </View>
        )}

        {recentActivityLogs.length > 0 && (
          <View style={[styles.recentCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.recentTitle, { color: colors.text }]}>Recent Activity (Last 5 Days)</Text>
            {recentActivityLogs.map((log, index) => (
              <View key={`activity-${log.id}-${index}`} style={[styles.activityItem, { borderBottomColor: colors.border }]}>
                <View style={[styles.activityIcon, { backgroundColor: colors.highlight }]}>
                  <IconSymbol
                    ios_icon_name="leaf.fill"
                    android_material_icon_name="eco"
                    size={20}
                    color={colors.secondary}
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { color: colors.text }]}>
                    {log.totalTrees} {log.species}
                  </Text>
                  <Text style={[styles.activityDate, { color: colors.textSecondary }]}>
                    {new Date(log.date).toLocaleDateString()} • {log.province}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleEditLog(log)}>
                  <IconSymbol
                    ios_icon_name="pencil.circle.fill"
                    android_material_icon_name="edit"
                    size={28}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal
        visible={showThemeMenu}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Theme</Text>
            <TouchableOpacity onPress={() => setShowThemeMenu(false)}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="close"
                size={32}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <FlatList
            data={APP_THEMES}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.themeList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.themeCard,
                  { 
                    backgroundColor: item.colors.card,
                    borderColor: selectedTheme === item.id ? colors.primary : item.colors.border,
                    borderWidth: selectedTheme === item.id ? 3 : 1,
                  },
                ]}
                onPress={() => handleThemeSelect(item.id)}
              >
                <View style={styles.themeHeader}>
                  <Text style={[styles.themeName, { color: item.colors.text }]}>{item.name}</Text>
                  {selectedTheme === item.id && (
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check-circle"
                      size={24}
                      color={colors.primary}
                    />
                  )}
                </View>
                <Text style={[styles.themeDescription, { color: item.colors.textSecondary }]}>
                  {item.description}
                </Text>
                <View style={styles.themeColors}>
                  <View style={[styles.themeColorDot, { backgroundColor: item.colors.primary }]} />
                  <View style={[styles.themeColorDot, { backgroundColor: item.colors.secondary }]} />
                  <View style={[styles.themeColorDot, { backgroundColor: item.colors.accent }]} />
                  <View style={[styles.themeColorDot, { backgroundColor: item.colors.background }]} />
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Activity</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="close"
                size={32}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={[styles.label, { color: colors.text }]}>Total Trees *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g., 2500"
              keyboardType="numeric"
              value={editTrees}
              onChangeText={setEditTrees}
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={[styles.label, { color: colors.text }]}>Species *</Text>
            <View style={styles.speciesContainer}>
              {TREE_SPECIES.map((species, speciesIndex) => (
                <TouchableOpacity
                  key={`edit-species-${species}-${speciesIndex}`}
                  style={[
                    styles.speciesButton,
                    { borderColor: colors.border },
                    editSpecies === species && { 
                      borderColor: colors.primary, 
                      backgroundColor: colors.highlight 
                    },
                  ]}
                  onPress={() => setEditSpecies(species)}
                >
                  <Text
                    style={[
                      styles.speciesText,
                      { color: colors.textSecondary },
                      editSpecies === species && { color: colors.primary, fontWeight: '600' },
                    ]}
                  >
                    {species}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Province *</Text>
            <View style={styles.provinceContainer}>
              {PROVINCES.map((province, provinceIndex) => (
                <TouchableOpacity
                  key={`edit-province-${province}-${provinceIndex}`}
                  style={[
                    styles.provinceButton,
                    { borderColor: colors.border },
                    editProvince === province && { 
                      borderColor: colors.primary, 
                      backgroundColor: colors.highlight 
                    },
                  ]}
                  onPress={() => setEditProvince(province)}
                >
                  <Text
                    style={[
                      styles.provinceText,
                      { color: colors.textSecondary },
                      editProvince === province && { color: colors.primary, fontWeight: '600' },
                    ]}
                  >
                    {province}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Land Type *</Text>
            <View style={styles.landTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.landTypeButton,
                  { borderColor: colors.border },
                  editLandType === 'prepped' && { 
                    borderColor: colors.primary, 
                    backgroundColor: colors.highlight 
                  },
                ]}
                onPress={() => setEditLandType('prepped')}
              >
                <Text
                  style={[
                    styles.landTypeText,
                    { color: colors.textSecondary },
                    editLandType === 'prepped' && { color: colors.primary, fontWeight: '600' },
                  ]}
                >
                  Prepped
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.landTypeButton,
                  { borderColor: colors.border },
                  editLandType === 'raw' && { 
                    borderColor: colors.primary, 
                    backgroundColor: colors.highlight 
                  },
                ]}
                onPress={() => setEditLandType('raw')}
              >
                <Text
                  style={[
                    styles.landTypeText,
                    { color: colors.textSecondary },
                    editLandType === 'raw' && { color: colors.primary, fontWeight: '600' },
                  ]}
                >
                  Raw
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSaveEdit}
            >
              <Text style={styles.submitButtonText}>Save Changes</Text>
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
    opacity: 0.1,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  menuButtonPlaceholder: {
    width: 44,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 6,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    marginTop: 4,
    textAlign: 'center',
  },
  chartCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 4,
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
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 48,
    borderRadius: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 22,
  },
  recentCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 13,
  },
  bottomPadding: {
    height: 20,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  themeList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  themeCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  themeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  themeName: {
    fontSize: 20,
    fontWeight: '700',
  },
  themeDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  themeColors: {
    flexDirection: 'row',
    gap: 8,
  },
  themeColorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  speciesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  speciesButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
  },
  speciesText: {
    fontSize: 14,
  },
  provinceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  provinceButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
  },
  provinceText: {
    fontSize: 14,
  },
  landTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  landTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  landTypeText: {
    fontSize: 16,
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 48,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
