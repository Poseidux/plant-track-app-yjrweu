
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
  Dimensions,
} from 'react-native';
import { Stack } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { StorageService } from '@/utils/storage';
import { EarningsLog } from '@/types/TreePlanting';
import { IconSymbol } from '@/components/IconSymbol';
import { LineChart } from 'react-native-chart-kit';

export default function EarningsScreen() {
  const [earningsLogs, setEarningsLogs] = useState<EarningsLog[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'hourly' | 'per-tree'>('per-tree');
  const [hoursWorked, setHoursWorked] = useState('');
  const [treesPlanted, setTreesPlanted] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const logs = await StorageService.getEarningsLogs();
    setEarningsLogs(logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const handleAddLog = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const newLog: EarningsLog = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      amount: parseFloat(amount),
      paymentType,
      hoursWorked: hoursWorked ? parseFloat(hoursWorked) : undefined,
      treesPlanted: treesPlanted ? parseInt(treesPlanted) : undefined,
      notes,
    };

    await StorageService.saveEarningsLog(newLog);
    await loadLogs();
    
    setAmount('');
    setHoursWorked('');
    setTreesPlanted('');
    setNotes('');
    setShowAddModal(false);
    Alert.alert('Success', 'Earnings log added successfully!');
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
            await StorageService.deleteEarningsLog(id);
            await loadLogs();
          },
        },
      ]
    );
  };

  const totalEarnings = earningsLogs.reduce((sum, log) => sum + log.amount, 0);
  const averageEarnings = earningsLogs.length > 0 ? totalEarnings / earningsLogs.length : 0;

  const getChartData = () => {
    const last7Logs = earningsLogs.slice(0, 7).reverse();
    return {
      labels: last7Logs.map((log) => 
        new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ),
      datasets: [
        {
          data: last7Logs.map((log) => log.amount),
          color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };
  };

  const screenWidth = Dimensions.get('window').width;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Earnings',
          headerLargeTitle: true,
          headerRight: () => (
            <TouchableOpacity onPress={() => setShowAddModal(true)}>
              <IconSymbol
                ios_icon_name="plus.circle.fill"
                android_material_icon_name="add-circle"
                size={32}
                color={colors.secondary}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryContainer}>
            <View style={[commonStyles.card, styles.summaryCard]}>
              <Text style={styles.summaryLabel}>Total Earnings</Text>
              <Text style={styles.summaryAmount}>${totalEarnings.toFixed(2)}</Text>
            </View>

            <View style={[commonStyles.card, styles.summaryCard]}>
              <Text style={styles.summaryLabel}>Average per Day</Text>
              <Text style={styles.summaryAmount}>${averageEarnings.toFixed(2)}</Text>
            </View>
          </View>

          {earningsLogs.length >= 2 && (
            <View style={[commonStyles.card, styles.chartCard]}>
              <Text style={commonStyles.cardTitle}>Earnings Trend</Text>
              <LineChart
                data={getChartData()}
                width={screenWidth - 64}
                height={220}
                chartConfig={{
                  backgroundColor: colors.card,
                  backgroundGradientFrom: colors.card,
                  backgroundGradientTo: colors.card,
                  decimalPlaces: 2,
                  color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(45, 52, 54, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: colors.primary,
                  },
                }}
                bezier
                style={styles.chart}
              />
            </View>
          )}

          {earningsLogs.length === 0 ? (
            <View style={[commonStyles.card, styles.emptyCard]}>
              <IconSymbol
                ios_icon_name="dollarsign.circle.fill"
                android_material_icon_name="attach-money"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyTitle}>No Earnings Yet</Text>
              <Text style={styles.emptyText}>
                Start tracking your earnings to see your financial progress!
              </Text>
            </View>
          ) : (
            earningsLogs.map((log) => (
              <View key={log.id} style={commonStyles.card}>
                <View style={styles.logHeader}>
                  <View style={styles.logHeaderLeft}>
                    <Text style={styles.logAmount}>${log.amount.toFixed(2)}</Text>
                    <Text style={styles.logDate}>
                      {new Date(log.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
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

                <View style={styles.logDetails}>
                  <View style={styles.logDetail}>
                    <IconSymbol
                      ios_icon_name="clock.fill"
                      android_material_icon_name="schedule"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.logDetailText}>
                      {log.paymentType === 'hourly' ? 'Hourly Rate' : 'Per Tree'}
                    </Text>
                  </View>

                  {log.hoursWorked && (
                    <View style={styles.logDetail}>
                      <IconSymbol
                        ios_icon_name="timer"
                        android_material_icon_name="timer"
                        size={16}
                        color={colors.accent}
                      />
                      <Text style={styles.logDetailText}>
                        {log.hoursWorked} hours
                      </Text>
                    </View>
                  )}

                  {log.treesPlanted && (
                    <View style={styles.logDetail}>
                      <IconSymbol
                        ios_icon_name="leaf.fill"
                        android_material_icon_name="eco"
                        size={16}
                        color={colors.secondary}
                      />
                      <Text style={styles.logDetailText}>
                        {log.treesPlanted} trees
                      </Text>
                    </View>
                  )}
                </View>

                {log.notes && (
                  <View style={styles.logNotes}>
                    <Text style={styles.logNotesText}>{log.notes}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>

        <Modal
          visible={showAddModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Earnings</Text>
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
              <Text style={styles.label}>Amount Earned *</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="e.g., 250.00"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={styles.label}>Payment Type *</Text>
              <View style={styles.paymentTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.paymentTypeButton,
                    paymentType === 'per-tree' && styles.paymentTypeButtonActive,
                  ]}
                  onPress={() => setPaymentType('per-tree')}
                >
                  <Text
                    style={[
                      styles.paymentTypeText,
                      paymentType === 'per-tree' && styles.paymentTypeTextActive,
                    ]}
                  >
                    Per Tree
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentTypeButton,
                    paymentType === 'hourly' && styles.paymentTypeButtonActive,
                  ]}
                  onPress={() => setPaymentType('hourly')}
                >
                  <Text
                    style={[
                      styles.paymentTypeText,
                      paymentType === 'hourly' && styles.paymentTypeTextActive,
                    ]}
                  >
                    Hourly
                  </Text>
                </TouchableOpacity>
              </View>

              {paymentType === 'hourly' && (
                <>
                  <Text style={styles.label}>Hours Worked</Text>
                  <TextInput
                    style={commonStyles.input}
                    placeholder="e.g., 8.5"
                    keyboardType="decimal-pad"
                    value={hoursWorked}
                    onChangeText={setHoursWorked}
                    placeholderTextColor={colors.textSecondary}
                  />
                </>
              )}

              {paymentType === 'per-tree' && (
                <>
                  <Text style={styles.label}>Trees Planted</Text>
                  <TextInput
                    style={commonStyles.input}
                    placeholder="e.g., 500"
                    keyboardType="numeric"
                    value={treesPlanted}
                    onChangeText={setTreesPlanted}
                    placeholderTextColor={colors.textSecondary}
                  />
                </>
              )}

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
                style={[buttonStyles.secondaryButton, styles.submitButton]}
                onPress={handleAddLog}
              >
                <Text style={buttonStyles.buttonText}>Save Earnings</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.secondary,
  },
  chartCard: {
    marginBottom: 24,
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
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
  logAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.secondary,
    marginBottom: 4,
  },
  logDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  logDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logDetailText: {
    fontSize: 14,
    color: colors.text,
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
  paymentTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  paymentTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  paymentTypeButtonActive: {
    borderColor: colors.secondary,
    backgroundColor: colors.highlight,
  },
  paymentTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  paymentTypeTextActive: {
    color: colors.secondary,
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
});
