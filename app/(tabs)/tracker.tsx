
import React, { useState, useEffect } from 'react';
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
import { TreePlantingLog, HourlyLog, PROVINCES, TREE_SPECIES, WEATHER_CONDITIONS } from '@/types/TreePlanting';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';

export default function TrackerScreen() {
  const { colors } = useThemeContext();
  const [treeLogs, setTreeLogs] = useState<TreePlantingLog[]>([]);
  const [currentDayLog, setCurrentDayLog] = useState<TreePlantingLog | null>(null);
  const [showAddHourlyModal, setShowAddHourlyModal] = useState(false);
  const [showEndDayModal, setShowEndDayModal] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  
  const [treesPlanted, setTreesPlanted] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState(TREE_SPECIES[0]);
  const [selectedProvince, setSelectedProvince] = useState(PROVINCES[0]);
  const [selectedWeather, setSelectedWeather] = useState(WEATHER_CONDITIONS[0]);
  const [notes, setNotes] = useState('');
  const [dayRating, setDayRating] = useState(3);

  const [showSpeciesPicker, setShowSpeciesPicker] = useState(false);
  const [showProvincePicker, setShowProvincePicker] = useState(false);
  const [showWeatherPicker, setShowWeatherPicker] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const logs = await StorageService.getTreeLogs();
    setTreeLogs(logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    const today = new Date().toISOString().split('T')[0];
    const todayLog = logs.find(log => log.date === today);
    setCurrentDayLog(todayLog || null);
  };

  const startSession = () => {
    setSessionStartTime(new Date());
    setShowAddHourlyModal(true);
  };

  const handleAddHourlyLog = async () => {
    if (!treesPlanted || parseInt(treesPlanted) <= 0) {
      Alert.alert('Error', 'Please enter a valid number of trees planted');
      return;
    }

    if (!sessionStartTime) {
      Alert.alert('Error', 'Session start time not recorded');
      return;
    }

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

    const today = new Date().toISOString().split('T')[0];
    const newHourlyLog: HourlyLog = {
      id: Date.now().toString(),
      startTime: startTimeStr,
      endTime: endTimeStr,
      treesPlanted: parseInt(treesPlanted),
    };

    let updatedLog: TreePlantingLog;

    if (currentDayLog) {
      updatedLog = {
        ...currentDayLog,
        hourlyLogs: [...currentDayLog.hourlyLogs, newHourlyLog],
        totalTrees: currentDayLog.totalTrees + parseInt(treesPlanted),
      };
    } else {
      updatedLog = {
        id: Date.now().toString(),
        date: today,
        hourlyLogs: [newHourlyLog],
        totalTrees: parseInt(treesPlanted),
        species: selectedSpecies,
        province: selectedProvince,
        weatherCondition: selectedWeather,
        notes: '',
      };
    }

    await StorageService.saveTreeLog(updatedLog);
    await loadLogs();
    
    setTreesPlanted('');
    setSessionStartTime(null);
    setShowAddHourlyModal(false);
    Alert.alert('Success', 'Hourly log added successfully!');
  };

  const handleEndDay = async () => {
    if (!currentDayLog) {
      Alert.alert('Error', 'No logs for today to end');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const totalHours = currentDayLog.hourlyLogs.length;
    const averageRate = totalHours > 0 ? currentDayLog.totalTrees / totalHours : 0;

    const updatedLog: TreePlantingLog = {
      ...currentDayLog,
      notes,
      dayRating,
      averageRate,
    };

    await StorageService.saveTreeLog(updatedLog);
    await loadLogs();
    
    setNotes('');
    setDayRating(3);
    setShowEndDayModal(false);
    
    Alert.alert(
      'Day Complete! 🎉',
      `Total Trees: ${currentDayLog.totalTrees}\nAverage Rate: ${averageRate.toFixed(0)} trees/hour\nRating: ${dayRating}/5`,
      [{ text: 'Great!', style: 'default' }]
    );
  };

  const handleDeleteHourlyLog = (logId: string, hourlyLogId: string) => {
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
  };

  const handleDeleteLog = (id: string) => {
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
  };

  const renderPicker = (
    visible: boolean,
    onClose: () => void,
    items: string[],
    selectedItem: string,
    onSelect: (item: string) => void,
    title: string
  ) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.pickerModal, { backgroundColor: colors.card }]}>
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
            keyExtractor={(item) => item}
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
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&q=80' }}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <View style={styles.overlay} />
      </ImageBackground>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>🌱 Daily Tracker</Text>
        </View>

        {currentDayLog && (
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
                  {currentDayLog.hourlyLogs.length}
                </Text>
                <Text style={[styles.currentDayStatLabel, { color: colors.textSecondary }]}>
                  Hours Logged
                </Text>
              </View>
            </View>

            <View style={styles.hourlyLogsList}>
              {currentDayLog.hourlyLogs.map((hourlyLog, index) => (
                <View 
                  key={index} 
                  style={[styles.hourlyLogItem, { backgroundColor: colors.highlight }]}
                >
                  <View style={styles.hourlyLogInfo}>
                    <Text style={[styles.hourlyLogTime, { color: colors.text }]}>
                      {hourlyLog.startTime} - {hourlyLog.endTime}
                    </Text>
                    <Text style={[styles.hourlyLogTrees, { color: colors.secondary }]}>
                      {hourlyLog.treesPlanted} trees
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => handleDeleteHourlyLog(currentDayLog.id, hourlyLog.id)}
                  >
                    <IconSymbol
                      ios_icon_name="trash.fill"
                      android_material_icon_name="delete"
                      size={20}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                </View>
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

        {!currentDayLog && (
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
        )}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Previous Days</Text>

        {treeLogs.filter(log => log.date !== new Date().toISOString().split('T')[0]).length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <IconSymbol
              ios_icon_name="tree.fill"
              android_material_icon_name="park"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Previous Logs</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Your previous planting days will appear here
            </Text>
          </View>
        ) : (
          treeLogs
            .filter(log => log.date !== new Date().toISOString().split('T')[0])
            .map((log) => (
              <View key={log.id} style={[styles.logCard, { backgroundColor: colors.card }]}>
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
                    <Text style={[styles.logProvince, { color: colors.textSecondary }]}>
                      {log.province}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteLog(log.id)}>
                    <IconSymbol
                      ios_icon_name="trash.fill"
                      android_material_icon_name="delete"
                      size={24}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                </View>

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
                      {log.hourlyLogs.length}
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
              </View>
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

            {!currentDayLog && (
              <>
                <Text style={[styles.label, { color: colors.text }]}>Tree Species *</Text>
                <TouchableOpacity
                  style={[styles.pickerButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setShowSpeciesPicker(true)}
                >
                  <Text style={[styles.pickerButtonText, { color: colors.text }]}>
                    {selectedSpecies}
                  </Text>
                  <IconSymbol
                    ios_icon_name="chevron.down"
                    android_material_icon_name="arrow-drop-down"
                    size={24}
                    color={colors.text}
                  />
                </TouchableOpacity>

                <Text style={[styles.label, { color: colors.text }]}>Province *</Text>
                <TouchableOpacity
                  style={[styles.pickerButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setShowProvincePicker(true)}
                >
                  <Text style={[styles.pickerButtonText, { color: colors.text }]}>
                    {selectedProvince}
                  </Text>
                  <IconSymbol
                    ios_icon_name="chevron.down"
                    android_material_icon_name="arrow-drop-down"
                    size={24}
                    color={colors.text}
                  />
                </TouchableOpacity>

                <Text style={[styles.label, { color: colors.text }]}>Weather *</Text>
                <TouchableOpacity
                  style={[styles.pickerButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setShowWeatherPicker(true)}
                >
                  <Text style={[styles.pickerButtonText, { color: colors.text }]}>
                    {selectedWeather}
                  </Text>
                  <IconSymbol
                    ios_icon_name="chevron.down"
                    android_material_icon_name="arrow-drop-down"
                    size={24}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </>
            )}

            <Text style={[styles.label, { color: colors.text }]}>Trees Planted *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g., 600"
              keyboardType="numeric"
              value={treesPlanted}
              onChangeText={setTreesPlanted}
              placeholderTextColor={colors.textSecondary}
            />

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
                        {currentDayLog.hourlyLogs.length}
                      </Text>
                    </View>
                    <View style={styles.summaryStat}>
                      <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>
                        Avg Rate
                      </Text>
                      <Text style={[styles.summaryStatValue, { color: colors.accent }]}>
                        {(currentDayLog.totalTrees / currentDayLog.hourlyLogs.length).toFixed(0)}/hr
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={[styles.label, { color: colors.text }]}>Rate Your Day</Text>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <TouchableOpacity
                      key={rating}
                      onPress={() => {
                        setDayRating(rating);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={styles.ratingButton}
                    >
                      <IconSymbol
                        ios_icon_name={rating <= dayRating ? "star.fill" : "star"}
                        android_material_icon_name={rating <= dayRating ? "star" : "star-border"}
                        size={40}
                        color={rating <= dayRating ? colors.accent : colors.border}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.label, { color: colors.text }]}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.notesInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                  placeholder="How was your day? Any challenges or achievements?"
                  multiline
                  numberOfLines={4}
                  value={notes}
                  onChangeText={setNotes}
                  placeholderTextColor={colors.textSecondary}
                />

                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: colors.accent }]}
                  onPress={handleEndDay}
                >
                  <Text style={styles.submitButtonText}>Complete Day</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {renderPicker(
        showSpeciesPicker,
        () => setShowSpeciesPicker(false),
        TREE_SPECIES,
        selectedSpecies,
        setSelectedSpecies,
        'Select Tree Species'
      )}

      {renderPicker(
        showProvincePicker,
        () => setShowProvincePicker(false),
        PROVINCES,
        selectedProvince,
        setSelectedProvince,
        'Select Province'
      )}

      {renderPicker(
        showWeatherPicker,
        () => setShowWeatherPicker(false),
        WEATHER_CONDITIONS,
        selectedWeather,
        setSelectedWeather,
        'Select Weather'
      )}
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
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  scrollContent: {
    paddingTop: Platform.OS === 'android' ? 60 : 16,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  currentDayCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  currentDayHeader: {
    marginBottom: 16,
  },
  currentDayTitle: {
    fontSize: 22,
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
    paddingVertical: 16,
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
    gap: 8,
    marginBottom: 16,
  },
  hourlyLogItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  hourlyLogInfo: {
    flex: 1,
  },
  hourlyLogTime: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  hourlyLogTrees: {
    fontSize: 16,
    fontWeight: '700',
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
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  startDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    gap: 12,
    boxShadow: '0px 4px 12px rgba(52, 152, 219, 0.3)',
    elevation: 4,
  },
  startDayButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
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
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 20,
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
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
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
  logProvince: {
    fontSize: 14,
  },
  logStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  logStat: {
    alignItems: 'center',
    gap: 4,
  },
  logStatNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  logStatLabel: {
    fontSize: 12,
  },
  logNotes: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  logNotesText: {
    fontSize: 14,
    lineHeight: 20,
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
    paddingTop: 48,
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
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  timeInfoText: {
    fontSize: 16,
    fontWeight: '600',
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
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  pickerButtonText: {
    fontSize: 16,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    height: 100,
    textAlignVertical: 'top',
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
    padding: 20,
    marginBottom: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  ratingButton: {
    padding: 4,
  },
});
