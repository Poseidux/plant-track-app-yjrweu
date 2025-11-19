
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
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { StorageService } from '@/utils/storage';
import { TreePlantingLog, PROVINCES, TREE_SPECIES, WEATHER_CONDITIONS } from '@/types/TreePlanting';
import { IconSymbol } from '@/components/IconSymbol';

export default function TrackerScreen() {
  const theme = useTheme();
  const [treeLogs, setTreeLogs] = useState<TreePlantingLog[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [treesPlanted, setTreesPlanted] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState(TREE_SPECIES[0]);
  const [selectedProvince, setSelectedProvince] = useState(PROVINCES[0]);
  const [selectedWeather, setSelectedWeather] = useState(WEATHER_CONDITIONS[0]);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [showSpeciesPicker, setShowSpeciesPicker] = useState(false);
  const [showProvincePicker, setShowProvincePicker] = useState(false);
  const [showWeatherPicker, setShowWeatherPicker] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const logs = await StorageService.getTreeLogs();
    setTreeLogs(logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const handleAddLog = async () => {
    if (!treesPlanted || parseInt(treesPlanted) <= 0) {
      Alert.alert('Error', 'Please enter a valid number of trees planted');
      return;
    }

    const newLog: TreePlantingLog = {
      id: Date.now().toString(),
      date,
      treesPlanted: parseInt(treesPlanted),
      species: selectedSpecies,
      province: selectedProvince,
      weatherCondition: selectedWeather,
      notes,
    };

    await StorageService.saveTreeLog(newLog);
    await loadLogs();
    
    setTreesPlanted('');
    setNotes('');
    setShowAddModal(false);
    Alert.alert('Success', 'Tree planting log added successfully!');
  };

  const handleDeleteLog = (id: string) => {
    Alert.alert(
      'Delete Log',
      'Are you sure you want to delete this log?',
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
        <View style={styles.pickerModal}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{title}</Text>
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
                  item === selectedItem && styles.pickerItemSelected,
                ]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    item === selectedItem && styles.pickerItemTextSelected,
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🌱 Planting Tracker</Text>
          <TouchableOpacity
            style={buttonStyles.primaryButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={buttonStyles.buttonText}>+ Add New Log</Text>
          </TouchableOpacity>
        </View>

        {treeLogs.length === 0 ? (
          <View style={[commonStyles.card, styles.emptyCard]}>
            <IconSymbol
              ios_icon_name="tree.fill"
              android_material_icon_name="park"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>No Logs Yet</Text>
            <Text style={styles.emptyText}>
              Start tracking your tree planting journey by adding your first log!
            </Text>
          </View>
        ) : (
          treeLogs.map((log) => (
            <View key={log.id} style={commonStyles.card}>
              <View style={styles.logHeader}>
                <View style={styles.logHeaderLeft}>
                  <Text style={styles.logDate}>
                    {new Date(log.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.logProvince}>{log.province}</Text>
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

              <View style={styles.logStats}>
                <View style={styles.logStat}>
                  <IconSymbol
                    ios_icon_name="leaf.fill"
                    android_material_icon_name="eco"
                    size={20}
                    color={colors.secondary}
                  />
                  <Text style={styles.logStatNumber}>{log.treesPlanted}</Text>
                  <Text style={styles.logStatLabel}>Trees</Text>
                </View>

                <View style={styles.logStat}>
                  <IconSymbol
                    ios_icon_name="tree.fill"
                    android_material_icon_name="park"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.logStatLabel}>{log.species}</Text>
                </View>

                <View style={styles.logStat}>
                  <IconSymbol
                    ios_icon_name="cloud.sun.fill"
                    android_material_icon_name="wb-sunny"
                    size={20}
                    color={colors.accent}
                  />
                  <Text style={styles.logStatLabel}>{log.weatherCondition}</Text>
                </View>
              </View>

              {log.notes && (
                <View style={styles.logNotes}>
                  <Text style={styles.logNotesText}>{log.notes}</Text>
                </View>
              )}
            </View>
          ))
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Planting Log</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="close"
                size={32}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Number of Trees Planted *</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="e.g., 500"
              keyboardType="numeric"
              value={treesPlanted}
              onChangeText={setTreesPlanted}
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.label}>Tree Species *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowSpeciesPicker(true)}
            >
              <Text style={styles.pickerButtonText}>{selectedSpecies}</Text>
              <IconSymbol
                ios_icon_name="chevron.down"
                android_material_icon_name="arrow-drop-down"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>

            <Text style={styles.label}>Province *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowProvincePicker(true)}
            >
              <Text style={styles.pickerButtonText}>{selectedProvince}</Text>
              <IconSymbol
                ios_icon_name="chevron.down"
                android_material_icon_name="arrow-drop-down"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>

            <Text style={styles.label}>Weather Condition *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowWeatherPicker(true)}
            >
              <Text style={styles.pickerButtonText}>{selectedWeather}</Text>
              <IconSymbol
                ios_icon_name="chevron.down"
                android_material_icon_name="arrow-drop-down"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>

            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[commonStyles.input, styles.notesInput]}
              placeholder="Add any additional notes..."
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
              placeholderTextColor={colors.textSecondary}
            />

            <TouchableOpacity
              style={[buttonStyles.primaryButton, styles.submitButton]}
              onPress={handleAddLog}
            >
              <Text style={buttonStyles.buttonText}>Save Log</Text>
            </TouchableOpacity>
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
  scrollContent: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
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
    color: colors.text,
    marginBottom: 4,
  },
  logProvince: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  logStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logStat: {
    alignItems: 'center',
    gap: 4,
  },
  logStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  logStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  logNotes: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.highlight,
    borderRadius: 8,
  },
  logNotesText: {
    fontSize: 14,
    color: colors.text,
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
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  pickerButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 48,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: colors.card,
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
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemSelected: {
    backgroundColor: colors.highlight,
  },
  pickerItemText: {
    fontSize: 16,
    color: colors.text,
  },
  pickerItemTextSelected: {
    fontWeight: '600',
    color: colors.primary,
  },
});
