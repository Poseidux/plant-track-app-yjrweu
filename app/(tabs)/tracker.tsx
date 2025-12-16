
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  Platform,
  ImageBackground,
} from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { StorageService } from '@/utils/storage';
import { TreePlantingLog, HourlyLog, TREE_SPECIES, DaySettings } from '@/types/TreePlanting';
import { IconSymbol } from '@/components/IconSymbol';
import MyForest from '@/components/MyForest';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DONT_ASK_SPECIES_KEY = '@dont_ask_species';

// Memoized hourly log item
const HourlyLogItem = React.memo(({ 
  hourlyLog, 
  colors, 
  onEdit, 
  onDelete 
}: {
  hourlyLog: HourlyLog;
  colors: any;
  onEdit: (log: HourlyLog) => void;
  onDelete: () => void;
}) => (
  <View style={[styles.hourlyLogItem, { backgroundColor: colors.highlight }]}>
    <View style={styles.hourlyLogInfo}>
      <Text style={[styles.hourlyLogTime, { color: colors.text }]}>
        {hourlyLog.startTime} - {hourlyLog.endTime}
      </Text>
      <Text style={[styles.hourlyLogTrees, { color: colors.secondary }]}>
        {hourlyLog.treesPlanted} trees
      </Text>
      {hourlyLog.species && (
        <Text style={[styles.hourlyLogDetail, { color: colors.textSecondary }]}>
          {hourlyLog.species} • {hourlyLog.landType === 'prepped' ? 'Prepped' : 'Raw'} land
        </Text>
      )}
    </View>
    <View style={styles.hourlyLogActions}>
      <TouchableOpacity 
        onPress={() => onEdit(hourlyLog)}
        style={styles.iconButton}
      >
        <IconSymbol
          ios_icon_name="pencil.circle.fill"
          android_material_icon_name="edit"
          size={24}
          color={colors.primary}
        />
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={onDelete}
        style={styles.iconButton}
      >
        <IconSymbol
          ios_icon_name="trash.fill"
          android_material_icon_name="delete"
          size={20}
          color={colors.error}
        />
      </TouchableOpacity>
    </View>
  </View>
));

// Memoized log card
const LogCard = React.memo(({ 
  log, 
  colors, 
  onDelete 
}: {
  log: TreePlantingLog;
  colors: any;
  onDelete: () => void;
}) => {
  const getDayTypeColor = (dayType?: 'normal' | 'sick' | 'dayoff') => {
    if (dayType === 'sick') return colors.error;
    if (dayType === 'dayoff') return colors.accent;
    return colors.secondary;
  };

  const getDayTypeLabel = (dayType?: 'normal' | 'sick' | 'dayoff') => {
    if (dayType === 'sick') return 'Sick Day';
    if (dayType === 'dayoff') return 'Day Off';
    return '';
  };

  return (
    <View style={[styles.logCard, { backgroundColor: colors.card, borderLeftColor: getDayTypeColor(log.dayType) }]}>
      <View style={styles.logHeader}>
        <View style={styles.logHeaderLeft}>
          <Text style={[styles.logDate, { color: colors.text }]}>
            {new Date(log.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
          {log.dayType && log.dayType !== 'normal' && (
            <Text style={[styles.logDayType, { color: getDayTypeColor(log.dayType) }]}>
              {getDayTypeLabel(log.dayType)}
            </Text>
          )}
          {log.province && (
            <Text style={[styles.logProvince, { color: colors.textSecondary }]}>
              {log.province}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={onDelete}>
          <IconSymbol
            ios_icon_name="trash.fill"
            android_material_icon_name="delete"
            size={24}
            color={colors.error}
          />
        </TouchableOpacity>
      </View>

      {(log.dayType === 'normal' || !log.dayType) && (
        <>
          <View style={[styles.logStats, { borderTopColor: colors.border }]}>
            <View style={styles.logStat}>
              <IconSymbol
                ios_icon_name="leaf.fill"
                android_material_icon_name="eco"
                size={20}
                color={colors.secondary}
              />
              <Text style={[styles.logStatNumber, { color: colors.text }]}>
                {log.totalTrees}
              </Text>
              <Text style={[styles.logStatLabel, { color: colors.textSecondary }]}>
                Trees
              </Text>
            </View>

            <View style={styles.logStat}>
              <IconSymbol
                ios_icon_name="clock.fill"
                android_material_icon_name="schedule"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.logStatNumber, { color: colors.text }]}>
                {(log.hourlyLogs || []).length}
              </Text>
              <Text style={[styles.logStatLabel, { color: colors.textSecondary }]}>
                Hours
              </Text>
            </View>

            {log.dayRating && (
              <View style={styles.logStat}>
                <IconSymbol
                  ios_icon_name="star.fill"
                  android_material_icon_name="star"
                  size={20}
                  color={colors.accent}
                />
                <Text style={[styles.logStatNumber, { color: colors.text }]}>
                  {log.dayRating}/5
                </Text>
                <Text style={[styles.logStatLabel, { color: colors.textSecondary }]}>
                  Rating
                </Text>
              </View>
            )}
          </View>

          {log.notes && (
            <View style={[styles.logNotes, { backgroundColor: colors.highlight }]}>
              <Text style={[styles.logNotesText, { color: colors.text }]}>
                {log.notes}
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
});

export default function TrackerScreen() {
  const { colors, isDark } = useThemeContext();
  const [treeLogs, setTreeLogs] = useState<TreePlantingLog[]>([]);
  const [currentDayLog, setCurrentDayLog] = useState<TreePlantingLog | null>(null);
  const [showAddHourlyModal, setShowAddHourlyModal] = useState(false);
  const [showEndDayModal, setShowEndDayModal] = useState(false);
  const [showSpeciesPopup, setShowSpeciesPopup] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dontAskSpecies, setDontAskSpecies] = useState(false);
  const [daySettings, setDaySettings] = useState<DaySettings>({
    treesPerBundle: 100,
    treesPerBox: 50,
    treesPerTray: 25,
  });
  
  const [bundles, setBundles] = useState('0');
  const [boxes, setBoxes] = useState('0');
  const [trays, setTrays] = useState('0');
  const [individualTrees, setIndividualTrees] = useState('0');
  
  const [treesPerBundle, setTreesPerBundle] = useState('100');
  const [treesPerBox, setTreesPerBox] = useState('50');
  const [treesPerTray, setTreesPerTray] = useState('25');
  
  const [selectedSpecies, setSelectedSpecies] = useState(TREE_SPECIES[0]);
  const [selectedLandType, setSelectedLandType] = useState<'prepped' | 'raw'>('prepped');
  const [notes, setNotes] = useState('');
  const [dayRating, setDayRating] = useState(3);

  const [tempTreesPlanted, setTempTreesPlanted] = useState(0);
  const [tempStartTime, setTempStartTime] = useState('');
  const [tempEndTime, setTempEndTime] = useState('');
  const [tempBundles, setTempBundles] = useState(0);
  const [tempBoxes, setTempBoxes] = useState(0);
  const [tempTrays, setTempTrays] = useState(0);
  const [tempIndividual, setTempIndividual] = useState(0);

  const [showSpeciesPicker, setShowSpeciesPicker] = useState(false);
  const [editingHourlyLog, setEditingHourlyLog] = useState<HourlyLog | null>(null);
  const [editTrees, setEditTrees] = useState('');

  const loadLogs = useCallback(async () => {
    const logs = await StorageService.getTreeLogs();
    setTreeLogs(logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    const today = new Date().toISOString().split('T')[0];
    const todayLog = logs.find(log => log.date === today);
    setCurrentDayLog(todayLog || null);
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    console.log('TrackerScreen mounted');
    loadLogs();
    loadDontAskPreference();
    loadDaySettings();
  }, [loadLogs]);

  const loadDontAskPreference = async () => {
    try {
      const value = await AsyncStorage.getItem(DONT_ASK_SPECIES_KEY);
      if (value !== null) {
        setDontAskSpecies(value === 'true');
      }
    } catch (error) {
      console.error('Error loading dont ask preference:', error);
    }
  };

  const saveDontAskPreference = async (value: boolean) => {
    try {
      await AsyncStorage.setItem(DONT_ASK_SPECIES_KEY, value.toString());
      setDontAskSpecies(value);
    } catch (error) {
      console.error('Error saving dont ask preference:', error);
    }
  };

  const loadDaySettings = async () => {
    const today = new Date().toISOString().split('T')[0];
    const settings = await StorageService.getDaySettings(today);
    if (settings) {
      setDaySettings(settings);
      setTreesPerBundle(settings.treesPerBundle.toString());
      setTreesPerBox(settings.treesPerBox.toString());
      setTreesPerTray(settings.treesPerTray.toString());
    }
  };

  const saveDaySettings = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const settings: DaySettings = {
      treesPerBundle: parseInt(treesPerBundle) || 100,
      treesPerBox: parseInt(treesPerBox) || 50,
      treesPerTray: parseInt(treesPerTray) || 25,
    };
    await StorageService.saveDaySettings(today, settings);
    setDaySettings(settings);
  }, [treesPerBundle, treesPerBox, treesPerTray]);

  const startSession = useCallback(() => {
    setSessionStartTime(new Date());
    
    if (currentDayLog && currentDayLog.hourlyLogs && currentDayLog.hourlyLogs.length > 0) {
      const lastHourlyLog = currentDayLog.hourlyLogs[currentDayLog.hourlyLogs.length - 1];
      if (lastHourlyLog.species) {
        setSelectedSpecies(lastHourlyLog.species);
      }
      if (lastHourlyLog.landType) {
        setSelectedLandType(lastHourlyLog.landType);
      }
    }
    
    setBundles('0');
    setBoxes('0');
    setTrays('0');
    setIndividualTrees('0');
    setShowAddHourlyModal(true);
  }, [currentDayLog]);

  const calculateTotalTrees = useCallback(() => {
    const bundleCount = parseInt(bundles) || 0;
    const boxCount = parseInt(boxes) || 0;
    const trayCount = parseInt(trays) || 0;
    const individualCount = parseInt(individualTrees) || 0;
    
    const bundleValue = parseInt(treesPerBundle) || 100;
    const boxValue = parseInt(treesPerBox) || 50;
    const trayValue = parseInt(treesPerTray) || 25;
    
    return (bundleCount * bundleValue) + (boxCount * boxValue) + (trayCount * trayValue) + individualCount;
  }, [bundles, boxes, trays, individualTrees, treesPerBundle, treesPerBox, treesPerTray]);

  const saveHourlyLogWithSpecies = useCallback(async (startTimeStr: string, endTimeStr: string, trees: number, species: string) => {
    const today = new Date().toISOString().split('T')[0];
    const newHourlyLog: HourlyLog = {
      id: Date.now().toString(),
      startTime: startTimeStr,
      endTime: endTimeStr,
      treesPlanted: trees,
      species: species,
      landType: selectedLandType,
      bundles: tempBundles,
      boxes: tempBoxes,
      trays: tempTrays,
      individualTrees: tempIndividual,
    };

    let updatedLog: TreePlantingLog;

    if (currentDayLog) {
      const existingHourlyLogs = currentDayLog.hourlyLogs || [];
      updatedLog = {
        ...currentDayLog,
        hourlyLogs: [...existingHourlyLogs, newHourlyLog],
        totalTrees: currentDayLog.totalTrees + trees,
      };
    } else {
      updatedLog = {
        id: Date.now().toString(),
        date: today,
        hourlyLogs: [newHourlyLog],
        totalTrees: trees,
        species: species,
        province: '',
        weatherCondition: '',
        notes: '',
        dayType: 'normal',
      };
    }

    await StorageService.saveTreeLog(updatedLog);
    await loadLogs();
    
    Alert.alert('Success', 'Hourly log added successfully!');
  }, [currentDayLog, selectedLandType, tempBundles, tempBoxes, tempTrays, tempIndividual, loadLogs]);

  const handleAddHourlyLog = useCallback(async () => {
    const totalTrees = calculateTotalTrees();
    
    if (totalTrees <= 0) {
      Alert.alert('Error', 'Please enter a valid number of trees planted');
      return;
    }

    if (!sessionStartTime) {
      Alert.alert('Error', 'Session start time not recorded');
      return;
    }

    await saveDaySettings();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const endTime = new Date();
    const startTimeStr = sessionStartTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const endTimeStr = endTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    setTempTreesPlanted(totalTrees);
    setTempStartTime(startTimeStr);
    setTempEndTime(endTimeStr);
    setTempBundles(parseInt(bundles) || 0);
    setTempBoxes(parseInt(boxes) || 0);
    setTempTrays(parseInt(trays) || 0);
    setTempIndividual(parseInt(individualTrees) || 0);

    setBundles('0');
    setBoxes('0');
    setTrays('0');
    setIndividualTrees('0');
    setSessionStartTime(null);
    setShowAddHourlyModal(false);

    if (!dontAskSpecies) {
      setShowSpeciesPopup(true);
    } else {
      await saveHourlyLogWithSpecies(startTimeStr, endTimeStr, totalTrees, selectedSpecies);
    }
  }, [calculateTotalTrees, sessionStartTime, saveDaySettings, bundles, boxes, trays, individualTrees, dontAskSpecies, selectedSpecies, saveHourlyLogWithSpecies]);

  const handleSpeciesPopupConfirm = useCallback(async () => {
    await saveHourlyLogWithSpecies(tempStartTime, tempEndTime, tempTreesPlanted, selectedSpecies);
    setShowSpeciesPopup(false);
  }, [saveHourlyLogWithSpecies, tempStartTime, tempEndTime, tempTreesPlanted, selectedSpecies]);

  const handleMarkSickDay = useCallback(async () => {
    Alert.alert(
      'Mark as Sick Day',
      'Are you sure you want to mark today as a sick day?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            const today = new Date().toISOString().split('T')[0];
            const sickDayLog: TreePlantingLog = {
              id: Date.now().toString(),
              date: today,
              hourlyLogs: [],
              totalTrees: 0,
              species: '',
              province: '',
              weatherCondition: '',
              notes: 'Sick Day',
              dayType: 'sick',
            };
            await StorageService.saveTreeLog(sickDayLog);
            await loadLogs();
            Alert.alert('Success', 'Today marked as sick day');
          },
        },
      ]
    );
  }, [loadLogs]);

  const handleMarkDayOff = useCallback(async () => {
    Alert.alert(
      'Mark as Day Off',
      'Are you sure you want to mark today as a day off?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            const today = new Date().toISOString().split('T')[0];
            const dayOffLog: TreePlantingLog = {
              id: Date.now().toString(),
              date: today,
              hourlyLogs: [],
              totalTrees: 0,
              species: '',
              province: '',
              weatherCondition: '',
              notes: 'Day Off',
              dayType: 'dayoff',
            };
            await StorageService.saveTreeLog(dayOffLog);
            await loadLogs();
            Alert.alert('Success', 'Today marked as day off');
          },
        },
      ]
    );
  }, [loadLogs]);

  const handleEditHourlyLog = useCallback((hourlyLog: HourlyLog) => {
    setEditingHourlyLog(hourlyLog);
    setEditTrees(hourlyLog.treesPlanted.toString());
    setShowEditModal(true);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingHourlyLog || !currentDayLog) {
      return;
    }

    const newTrees = parseInt(editTrees);
    if (!newTrees || newTrees <= 0) {
      Alert.alert('Error', 'Please enter a valid number of trees');
      return;
    }

    const oldTrees = editingHourlyLog.treesPlanted;
    const treeDifference = newTrees - oldTrees;

    const existingHourlyLogs = currentDayLog.hourlyLogs || [];
    const updatedHourlyLogs = existingHourlyLogs.map(hl => 
      hl.id === editingHourlyLog.id ? { ...hl, treesPlanted: newTrees } : hl
    );

    const updatedLog: TreePlantingLog = {
      ...currentDayLog,
      hourlyLogs: updatedHourlyLogs,
      totalTrees: currentDayLog.totalTrees + treeDifference,
    };

    await StorageService.saveTreeLog(updatedLog);
    await loadLogs();
    setShowEditModal(false);
    setEditingHourlyLog(null);
    Alert.alert('Success', 'Log updated successfully!');
  }, [editingHourlyLog, currentDayLog, editTrees, loadLogs]);

  const handleEndDay = useCallback(async () => {
    if (!currentDayLog) {
      Alert.alert('Error', 'No logs for today to end');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const hourlyLogsArray = currentDayLog.hourlyLogs || [];
    const totalHours = hourlyLogsArray.length;
    const averageRate = totalHours > 0 ? currentDayLog.totalTrees / totalHours : 0;

    const updatedLog: TreePlantingLog = {
      ...currentDayLog,
      notes,
      dayRating,
      averageRate,
    };

    await StorageService.saveTreeLog(updatedLog);
    
    setNotes('');
    setDayRating(3);
    setShowEndDayModal(false);
    
    await loadLogs();
    
    Alert.alert(
      'Day Complete! 🎉',
      `Total Trees: ${currentDayLog.totalTrees}\nAverage Rate: ${averageRate.toFixed(0)} trees/hour\nRating: ${dayRating}/5`,
      [{ text: 'Great!', style: 'default' }]
    );
  }, [currentDayLog, notes, dayRating, loadLogs]);

  const handleDeleteHourlyLog = useCallback((logId: string, hourlyLogId: string) => {
    Alert.alert(
      'Delete Hourly Log',
      'Are you sure you want to delete this hourly log?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await StorageService.deleteHourlyLog(logId, hourlyLogId);
            await loadLogs();
          },
        },
      ]
    );
  }, [loadLogs]);

  const handleDeleteLog = useCallback((id: string) => {
    Alert.alert(
      'Delete Log',
      'Are you sure you want to delete this entire day log?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await StorageService.deleteTreeLog(id);
            await loadLogs();
          },
        },
      ]
    );
  }, [loadLogs]);

  const renderPicker = (
    visible: boolean,
    onClose: () => void,
    items: string[],
    selectedItem: string,
    onSelect: (item: string) => void,
    title: string
  ) => (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          style={[styles.pickerModal, { backgroundColor: colors.card }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="close"
                size={28}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
          <FlatList
            data={items}
            keyExtractor={(item, index) => `picker-item-${title}-${item}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  { borderBottomColor: colors.border },
                  item === selectedItem && { backgroundColor: colors.highlight },
                ]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    { color: colors.text },
                    item === selectedItem && { fontWeight: '600', color: colors.primary },
                  ]}
                >
                  {item}
                </Text>
                {item === selectedItem && (
                  <IconSymbol
                    ios_icon_name="checkmark"
                    android_material_icon_name="check"
                    size={20}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            )}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  // Memoize previous logs
  const previousLogs = useMemo(() => 
    treeLogs.filter(log => log.date !== new Date().toISOString().split('T')[0])
  , [treeLogs]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} key={`tracker-${refreshKey}`}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&q=80' }}
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
          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Daily Tracker</Text>
            <TouchableOpacity
              style={[styles.settingsButton, { backgroundColor: colors.card }]}
              onPress={() => {
                Alert.alert(
                  'Species Prompt',
                  dontAskSpecies 
                    ? 'Enable species prompt after logging?' 
                    : 'Disable species prompt after logging?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: dontAskSpecies ? 'Enable' : 'Disable',
                      onPress: () => saveDontAskPreference(!dontAskSpecies),
                    },
                  ]
                );
              }}
            >
              <IconSymbol
                ios_icon_name={dontAskSpecies ? "bell.slash.fill" : "bell.fill"}
                android_material_icon_name={dontAskSpecies ? "notifications-off" : "notifications"}
                size={20}
                color={dontAskSpecies ? colors.textSecondary : colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {currentDayLog && currentDayLog.dayType !== 'sick' && currentDayLog.dayType !== 'dayoff' && (
          <View style={[styles.currentDayCard, { backgroundColor: colors.card }]}>
            <View style={styles.currentDayHeader}>
              <Text style={[styles.currentDayTitle, { color: colors.text }]}>
                Today&apos;s Progress
              </Text>
              <Text style={[styles.currentDayDate, { color: colors.textSecondary }]}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </View>

            <View style={styles.currentDayStats}>
              <View style={styles.currentDayStat}>
                <Text style={[styles.currentDayStatNumber, { color: colors.secondary }]}>
                  {currentDayLog.totalTrees}
                </Text>
                <Text style={[styles.currentDayStatLabel, { color: colors.textSecondary }]}>
                  Total Trees
                </Text>
              </View>
              <View style={styles.currentDayStat}>
                <Text style={[styles.currentDayStatNumber, { color: colors.primary }]}>
                  {(currentDayLog.hourlyLogs || []).length}
                </Text>
                <Text style={[styles.currentDayStatLabel, { color: colors.textSecondary }]}>
                  Hours Logged
                </Text>
              </View>
            </View>

            <View style={styles.hourlyLogsList}>
              {(currentDayLog.hourlyLogs || []).map((hourlyLog, index) => (
                <HourlyLogItem
                  key={`hourly-${hourlyLog.id}-${index}`}
                  hourlyLog={hourlyLog}
                  colors={colors}
                  onEdit={handleEditHourlyLog}
                  onDelete={() => handleDeleteHourlyLog(currentDayLog.id, hourlyLog.id)}
                />
              ))}
            </View>

            <View style={styles.currentDayActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={startSession}
              >
                <IconSymbol
                  ios_icon_name="plus.circle.fill"
                  android_material_icon_name="add-circle"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.actionButtonText}>Add Hour</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.accent }]}
                onPress={() => setShowEndDayModal(true)}
              >
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.actionButtonText}>End Day</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {currentDayLog && (currentDayLog.dayType === 'sick' || currentDayLog.dayType === 'dayoff') && (
          <View style={[styles.specialDayCard, { backgroundColor: colors.card, borderColor: currentDayLog.dayType === 'sick' ? colors.error : colors.accent }]}>
            <IconSymbol
              ios_icon_name={currentDayLog.dayType === 'sick' ? 'cross.case.fill' : 'beach.umbrella.fill'}
              android_material_icon_name={currentDayLog.dayType === 'sick' ? 'local-hospital' : 'beach-access'}
              size={48}
              color={currentDayLog.dayType === 'sick' ? colors.error : colors.accent}
            />
            <Text style={[styles.specialDayTitle, { color: colors.text }]}>
              {currentDayLog.dayType === 'sick' ? 'Sick Day' : 'Day Off'}
            </Text>
            <Text style={[styles.specialDaySubtitle, { color: colors.textSecondary }]}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>
        )}

        {!currentDayLog && (
          <View>
            <TouchableOpacity
              style={[styles.startDayButton, { backgroundColor: colors.primary }]}
              onPress={startSession}
            >
              <IconSymbol
                ios_icon_name="play.circle.fill"
                android_material_icon_name="play-circle-filled"
                size={32}
                color="#FFFFFF"
              />
              <Text style={styles.startDayButtonText}>Start Today&apos;s Log</Text>
            </TouchableOpacity>

            <View style={styles.specialDayButtons}>
              <TouchableOpacity
                style={[styles.specialDayButton, { backgroundColor: colors.error }]}
                onPress={handleMarkSickDay}
              >
                <IconSymbol
                  ios_icon_name="cross.case.fill"
                  android_material_icon_name="local-hospital"
                  size={24}
                  color="#FFFFFF"
                />
                <Text style={styles.specialDayButtonText}>Sick Day</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.specialDayButton, { backgroundColor: colors.accent }]}
                onPress={handleMarkDayOff}
              >
                <IconSymbol
                  ios_icon_name="beach.umbrella.fill"
                  android_material_icon_name="beach-access"
                  size={24}
                  color="#FFFFFF"
                />
                <Text style={styles.specialDayButtonText}>Day Off</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Previous Days</Text>

        {treeLogs.length > 0 && (
          <MyForest treeLogs={treeLogs} />
        )}

        {previousLogs.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <IconSymbol
              ios_icon_name="tree.fill"
              android_material_icon_name="park"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>🌲 No Previous Logs</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Your previous planting days will appear here
            </Text>
          </View>
        ) : (
          previousLogs.map((log, logIndex) => (
            <LogCard
              key={`log-${log.id}-${logIndex}`}
              log={log}
              colors={colors}
              onDelete={() => handleDeleteLog(log.id)}
            />
          ))
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal
        visible={showAddHourlyModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Hourly Log</Text>
            <TouchableOpacity onPress={() => {
              setShowAddHourlyModal(false);
              setSessionStartTime(null);
            }}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="close"
                size={32}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {sessionStartTime && (
              <View style={[styles.timeInfo, { backgroundColor: colors.highlight }]}>
                <IconSymbol
                  ios_icon_name="clock.fill"
                  android_material_icon_name="schedule"
                  size={24}
                  color={colors.primary}
                />
                <Text style={[styles.timeInfoText, { color: colors.text }]}>
                  Session started at {sessionStartTime.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </Text>
              </View>
            )}

            <Text style={[styles.label, { color: colors.text }]}>Trees Planted</Text>
            
            <View style={styles.treeInputRow}>
              <View style={styles.treeInputGroup}>
                <Text style={[styles.treeInputLabel, { color: colors.textSecondary }]}>Bundles</Text>
                <View style={styles.treeInputWithSetting}>
                  <TextInput
                    style={[styles.treeInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                    placeholder="0"
                    keyboardType="numeric"
                    value={bundles}
                    onChangeText={setBundles}
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TextInput
                    style={[styles.treeSettingInput, { backgroundColor: colors.highlight, borderColor: colors.border, color: colors.text }]}
                    placeholder="100"
                    keyboardType="numeric"
                    value={treesPerBundle}
                    onChangeText={setTreesPerBundle}
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Text style={[styles.treeSettingLabel, { color: colors.textSecondary }]}>per</Text>
                </View>
              </View>

              <View style={styles.treeInputGroup}>
                <Text style={[styles.treeInputLabel, { color: colors.textSecondary }]}>Boxes</Text>
                <View style={styles.treeInputWithSetting}>
                  <TextInput
                    style={[styles.treeInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                    placeholder="0"
                    keyboardType="numeric"
                    value={boxes}
                    onChangeText={setBoxes}
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TextInput
                    style={[styles.treeSettingInput, { backgroundColor: colors.highlight, borderColor: colors.border, color: colors.text }]}
                    placeholder="50"
                    keyboardType="numeric"
                    value={treesPerBox}
                    onChangeText={setTreesPerBox}
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Text style={[styles.treeSettingLabel, { color: colors.textSecondary }]}>per</Text>
                </View>
              </View>
            </View>

            <View style={styles.treeInputRow}>
              <View style={styles.treeInputGroup}>
                <Text style={[styles.treeInputLabel, { color: colors.textSecondary }]}>Trays</Text>
                <View style={styles.treeInputWithSetting}>
                  <TextInput
                    style={[styles.treeInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                    placeholder="0"
                    keyboardType="numeric"
                    value={trays}
                    onChangeText={setTrays}
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TextInput
                    style={[styles.treeSettingInput, { backgroundColor: colors.highlight, borderColor: colors.border, color: colors.text }]}
                    placeholder="25"
                    keyboardType="numeric"
                    value={treesPerTray}
                    onChangeText={setTreesPerTray}
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Text style={[styles.treeSettingLabel, { color: colors.textSecondary }]}>per</Text>
                </View>
              </View>

              <View style={styles.treeInputGroup}>
                <Text style={[styles.treeInputLabel, { color: colors.textSecondary }]}>Individual</Text>
                <TextInput
                  style={[styles.treeInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                  placeholder="0"
                  keyboardType="numeric"
                  value={individualTrees}
                  onChangeText={setIndividualTrees}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View style={[styles.totalTreesCard, { backgroundColor: colors.highlight }]}>
              <Text style={[styles.totalTreesLabel, { color: colors.textSecondary }]}>Total Trees</Text>
              <Text style={[styles.totalTreesValue, { color: colors.primary }]}>
                {calculateTotalTrees()}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleAddHourlyLog}
            >
              <Text style={styles.submitButtonText}>Save Hourly Log</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
      >
        <View style={styles.popupOverlay}>
          <View style={[styles.popupContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.popupTitle, { color: colors.text }]}>Edit Trees Planted</Text>
            
            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Trees Planted *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g., 600"
              keyboardType="numeric"
              value={editTrees}
              onChangeText={setEditTrees}
              placeholderTextColor={colors.textSecondary}
            />

            <View style={styles.popupButtons}>
              <TouchableOpacity
                style={[styles.popupButton, { backgroundColor: colors.textSecondary, flex: 1, marginRight: 8 }]}
                onPress={() => {
                  setShowEditModal(false);
                  setEditingHourlyLog(null);
                }}
              >
                <Text style={styles.popupButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.popupButton, { backgroundColor: colors.primary, flex: 1 }]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.popupButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSpeciesPopup}
        transparent
        animationType="fade"
      >
        <View style={styles.popupOverlay}>
          <View style={[styles.popupContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.popupTitle, { color: colors.text }]}>Select Tree Species</Text>
            <Text style={[styles.popupSubtitle, { color: colors.textSecondary }]}>
              What species did you plant?
            </Text>

            <ScrollView style={styles.speciesScrollView} showsVerticalScrollIndicator={true}>
              {TREE_SPECIES.map((species, speciesIndex) => (
                <TouchableOpacity
                  key={`species-option-${species}-${speciesIndex}`}
                  style={[
                    styles.speciesOptionButton,
                    { borderColor: colors.border },
                    selectedSpecies === species && { 
                      borderColor: colors.primary, 
                      backgroundColor: colors.highlight 
                    },
                  ]}
                  onPress={() => {
                    setSelectedSpecies(species);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text
                    style={[
                      styles.speciesOptionText,
                      { color: colors.text },
                      selectedSpecies === species && { color: colors.primary, fontWeight: '600' },
                    ]}
                  >
                    {species}
                  </Text>
                  {selectedSpecies === species && (
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check-circle"
                      size={24}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Land Type</Text>
            <View style={styles.landTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.landTypeButton,
                  { borderColor: colors.border },
                  selectedLandType === 'prepped' && { 
                    borderColor: colors.primary, 
                    backgroundColor: colors.highlight 
                  },
                ]}
                onPress={() => setSelectedLandType('prepped')}
              >
                <Text
                  style={[
                    styles.landTypeText,
                    { color: colors.textSecondary },
                    selectedLandType === 'prepped' && { color: colors.primary, fontWeight: '600' },
                  ]}
                >
                  Prepped
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.landTypeButton,
                  { borderColor: colors.border },
                  selectedLandType === 'raw' && { 
                    borderColor: colors.primary, 
                    backgroundColor: colors.highlight 
                  },
                ]}
                onPress={() => setSelectedLandType('raw')}
              >
                <Text
                  style={[
                    styles.landTypeText,
                    { color: colors.textSecondary },
                    selectedLandType === 'raw' && { color: colors.primary, fontWeight: '600' },
                  ]}
                >
                  Raw
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.popupButtons}>
              <TouchableOpacity
                style={[styles.popupButton, { backgroundColor: colors.primary }]}
                onPress={handleSpeciesPopupConfirm}
              >
                <Text style={styles.popupButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEndDayModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>End Day Summary</Text>
            <TouchableOpacity onPress={() => setShowEndDayModal(false)}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="close"
                size={32}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {currentDayLog && (
              <>
                <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
                  <Text style={[styles.summaryTitle, { color: colors.text }]}>
                    Today&apos;s Summary
                  </Text>
                  <View style={styles.summaryStats}>
                    <View style={styles.summaryStat}>
                      <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>
                        Total Trees
                      </Text>
                      <Text style={[styles.summaryStatValue, { color: colors.secondary }]}>
                        {currentDayLog.totalTrees}
                      </Text>
                    </View>
                    <View style={styles.summaryStat}>
                      <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>
                        Hours Worked
                      </Text>
                      <Text style={[styles.summaryStatValue, { color: colors.primary }]}>
                        {(currentDayLog.hourlyLogs || []).length}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={[styles.label, { color: colors.text }]}>Day Rating</Text>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <TouchableOpacity
                      key={`rating-${rating}`}
                      style={[
                        styles.ratingButton,
                        { borderColor: colors.border },
                        dayRating === rating && { 
                          borderColor: colors.accent, 
                          backgroundColor: colors.highlight 
                        },
                      ]}
                      onPress={() => setDayRating(rating)}
                    >
                      <IconSymbol
                        ios_icon_name={dayRating >= rating ? "star.fill" : "star"}
                        android_material_icon_name={dayRating >= rating ? "star" : "star-border"}
                        size={28}
                        color={dayRating >= rating ? colors.accent : colors.textSecondary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.label, { color: colors.text }]}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                  placeholder="How was your day? Any challenges or achievements?"
                  multiline
                  numberOfLines={4}
                  value={notes}
                  onChangeText={setNotes}
                  placeholderTextColor={colors.textSecondary}
                />

                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: colors.primary }]}
                  onPress={handleEndDay}
                >
                  <Text style={styles.submitButtonText}>Complete Day</Text>
                </TouchableOpacity>
              </>
            )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
    position: 'absolute',
    right: 0,
  },
  currentDayCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 6,
  },
  currentDayHeader: {
    marginBottom: 16,
  },
  currentDayTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  currentDayDate: {
    fontSize: 14,
  },
  currentDayStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
  },
  currentDayStat: {
    alignItems: 'center',
  },
  currentDayStatNumber: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  currentDayStatLabel: {
    fontSize: 12,
  },
  hourlyLogsList: {
    marginBottom: 16,
  },
  hourlyLogItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  hourlyLogInfo: {
    flex: 1,
  },
  hourlyLogTime: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  hourlyLogTrees: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  hourlyLogDetail: {
    fontSize: 12,
  },
  hourlyLogActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  currentDayActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
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
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  specialDayCard: {
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 3,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 6,
  },
  specialDayTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
  },
  specialDaySubtitle: {
    fontSize: 14,
  },
  startDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
    elevation: 6,
  },
  startDayButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  specialDayButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  specialDayButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
  specialDayButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 48,
    borderRadius: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  logCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  logHeaderLeft: {
    flex: 1,
  },
  logDate: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  logDayType: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  logProvince: {
    fontSize: 13,
  },
  logStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  logStat: {
    alignItems: 'center',
  },
  logStatNumber: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 2,
  },
  logStatLabel: {
    fontSize: 11,
  },
  logNotes: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  logNotesText: {
    fontSize: 13,
    lineHeight: 18,
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
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  timeInfoText: {
    fontSize: 15,
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  treeInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  treeInputGroup: {
    flex: 1,
  },
  treeInputLabel: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '600',
  },
  treeInputWithSetting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  treeInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  treeSettingInput: {
    width: 50,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  treeSettingLabel: {
    fontSize: 11,
  },
  totalTreesCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  totalTreesLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  totalTreesValue: {
    fontSize: 36,
    fontWeight: '800',
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
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  popupContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  popupSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  speciesScrollView: {
    maxHeight: 300,
    marginBottom: 16,
  },
  speciesOptionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 8,
  },
  speciesOptionText: {
    fontSize: 15,
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
  popupButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  popupButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
  popupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  pickerItemText: {
    fontSize: 16,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatLabel: {
    fontSize: 13,
    marginBottom: 8,
  },
  summaryStatValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  ratingButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    marginBottom: 24,
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
