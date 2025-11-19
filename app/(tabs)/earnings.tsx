
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
  Platform,
  ImageBackground,
} from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { StorageService } from '@/utils/storage';
import { EarningsLog, ExpenseLog, EXPENSE_CATEGORIES } from '@/types/TreePlanting';
import { IconSymbol } from '@/components/IconSymbol';
import { LineChart, BarChart } from 'react-native-chart-kit';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';

export default function EarningsScreen() {
  const { colors, isDark } = useThemeContext();
  const [earningsLogs, setEarningsLogs] = useState<EarningsLog[]>([]);
  const [expenseLogs, setExpenseLogs] = useState<ExpenseLog[]>([]);
  const [showAddEarningsModal, setShowAddEarningsModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [expenseCategory, setExpenseCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [expenseDescription, setExpenseDescription] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const [earnings, expenses] = await Promise.all([
      StorageService.getEarningsLogs(),
      StorageService.getExpenseLogs(),
    ]);
    setEarningsLogs(earnings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setExpenseLogs(expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const handleAddEarnings = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const newLog: EarningsLog = {
      id: Date.now().toString(),
      date: selectedDate.toISOString().split('T')[0],
      amount: parseFloat(amount),
      paymentType: 'per-tree',
      notes,
    };

    await StorageService.saveEarningsLog(newLog);
    await loadLogs();
    
    setAmount('');
    setNotes('');
    setSelectedDate(new Date());
    setShowAddEarningsModal(false);
    Alert.alert('Success', 'Earnings added successfully!');
  };

  const handleAddExpense = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const newLog: ExpenseLog = {
      id: Date.now().toString(),
      date: selectedDate.toISOString().split('T')[0],
      amount: parseFloat(amount),
      category: expenseCategory,
      description: expenseDescription,
    };

    await StorageService.saveExpenseLog(newLog);
    await loadLogs();
    
    setAmount('');
    setExpenseDescription('');
    setSelectedDate(new Date());
    setShowAddExpenseModal(false);
    Alert.alert('Success', 'Expense added successfully!');
  };

  const handleDeleteEarnings = (id: string) => {
    Alert.alert(
      'Delete Earnings',
      'Are you sure you want to delete this earnings log?',
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

  const handleDeleteExpense = (id: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense log?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await StorageService.deleteExpenseLog(id);
            await loadLogs();
          },
        },
      ]
    );
  };

  const totalEarnings = earningsLogs.reduce((sum, log) => sum + log.amount, 0);
  const totalExpenses = expenseLogs.reduce((sum, log) => sum + log.amount, 0);
  const netIncome = totalEarnings - totalExpenses;

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

  const screenWidth = Dimensions.get('window').width;

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
    labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(45, 52, 54, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: colors.secondary,
    },
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&q=80' }}
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>💰 Earnings & Expenses</Text>
        </View>

        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: colors.secondary }]}>
            <IconSymbol
              ios_icon_name="arrow.up.circle.fill"
              android_material_icon_name="arrow-upward"
              size={24}
              color="#FFFFFF"
            />
            <Text style={styles.summaryAmount}>${totalEarnings.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Total Earnings</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.error }]}>
            <IconSymbol
              ios_icon_name="arrow.down.circle.fill"
              android_material_icon_name="arrow-downward"
              size={24}
              color="#FFFFFF"
            />
            <Text style={styles.summaryAmount}>${totalExpenses.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Total Expenses</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: netIncome >= 0 ? colors.primary : colors.warning }]}>
            <IconSymbol
              ios_icon_name="banknote.fill"
              android_material_icon_name="account-balance-wallet"
              size={24}
              color="#FFFFFF"
            />
            <Text style={styles.summaryAmount}>${netIncome.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Net Income</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.secondary }]}
            onPress={() => setShowAddEarningsModal(true)}
          >
            <IconSymbol
              ios_icon_name="plus.circle.fill"
              android_material_icon_name="add-circle"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.actionButtonText}>Add Earnings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error }]}
            onPress={() => setShowAddExpenseModal(true)}
          >
            <IconSymbol
              ios_icon_name="minus.circle.fill"
              android_material_icon_name="remove-circle"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.actionButtonText}>Add Expense</Text>
          </TouchableOpacity>
        </View>

        {earningsLogs.length >= 2 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Earnings Trend (Last 7 Days)</Text>
            <LineChart
              data={getEarningsChartData()}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Earnings</Text>
        {earningsLogs.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <IconSymbol
              ios_icon_name="dollarsign.circle.fill"
              android_material_icon_name="attach-money"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Earnings Yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Start tracking your earnings to see your financial progress!
            </Text>
          </View>
        ) : (
          earningsLogs.slice(0, 10).map((log) => (
            <View key={log.id} style={[styles.logCard, { backgroundColor: colors.card }]}>
              <View style={styles.logHeader}>
                <View style={styles.logHeaderLeft}>
                  <Text style={[styles.logAmount, { color: colors.secondary }]}>
                    +${log.amount.toFixed(2)}
                  </Text>
                  <Text style={[styles.logDate, { color: colors.textSecondary }]}>
                    {new Date(log.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteEarnings(log.id)}>
                  <IconSymbol
                    ios_icon_name="trash.fill"
                    android_material_icon_name="delete"
                    size={24}
                    color={colors.error}
                  />
                </TouchableOpacity>
              </View>

              {log.notes && (
                <View style={[styles.logNotes, { backgroundColor: colors.highlight }]}>
                  <Text style={[styles.logNotesText, { color: colors.text }]}>{log.notes}</Text>
                </View>
              )}
            </View>
          ))
        )}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Expenses</Text>
        {expenseLogs.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <IconSymbol
              ios_icon_name="cart.fill"
              android_material_icon_name="shopping-cart"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Expenses Yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Track your expenses to better manage your finances!
            </Text>
          </View>
        ) : (
          expenseLogs.slice(0, 10).map((log) => (
            <View key={log.id} style={[styles.logCard, { backgroundColor: colors.card }]}>
              <View style={styles.logHeader}>
                <View style={styles.logHeaderLeft}>
                  <Text style={[styles.logAmount, { color: colors.error }]}>
                    -${log.amount.toFixed(2)}
                  </Text>
                  <Text style={[styles.logDate, { color: colors.textSecondary }]}>
                    {new Date(log.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text style={[styles.logCategory, { color: colors.primary }]}>
                    {log.category}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteExpense(log.id)}>
                  <IconSymbol
                    ios_icon_name="trash.fill"
                    android_material_icon_name="delete"
                    size={24}
                    color={colors.error}
                  />
                </TouchableOpacity>
              </View>

              {log.description && (
                <View style={[styles.logNotes, { backgroundColor: colors.highlight }]}>
                  <Text style={[styles.logNotesText, { color: colors.text }]}>{log.description}</Text>
                </View>
              )}
            </View>
          ))
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal
        visible={showAddEarningsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Earnings</Text>
            <TouchableOpacity onPress={() => setShowAddEarningsModal(false)}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="close"
                size={32}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={[styles.label, { color: colors.text }]}>Date *</Text>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="calendar-today"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.dateButtonText, { color: colors.text }]}>
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
              />
            )}

            <Text style={[styles.label, { color: colors.text }]}>Amount Earned *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g., 250.00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={[styles.label, { color: colors.text }]}>Notes (Optional)</Text>
            <TextInput
              style={[styles.notesInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Add any additional notes..."
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
              placeholderTextColor={colors.textSecondary}
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.secondary }]}
              onPress={handleAddEarnings}
            >
              <Text style={styles.submitButtonText}>Save Earnings</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showAddExpenseModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Expense</Text>
            <TouchableOpacity onPress={() => setShowAddExpenseModal(false)}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="close"
                size={32}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={[styles.label, { color: colors.text }]}>Date *</Text>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="calendar-today"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.dateButtonText, { color: colors.text }]}>
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
              />
            )}

            <Text style={[styles.label, { color: colors.text }]}>Category *</Text>
            <View style={styles.categoryContainer}>
              {EXPENSE_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    { borderColor: colors.border },
                    expenseCategory === category && { 
                      borderColor: colors.error, 
                      backgroundColor: colors.highlight 
                    },
                  ]}
                  onPress={() => setExpenseCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      { color: colors.textSecondary },
                      expenseCategory === category && { color: colors.error, fontWeight: '600' },
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Amount *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g., 50.00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={[styles.label, { color: colors.text }]}>Description (Optional)</Text>
            <TextInput
              style={[styles.notesInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="What was this expense for?"
              multiline
              numberOfLines={4}
              value={expenseDescription}
              onChangeText={setExpenseDescription}
              placeholderTextColor={colors.textSecondary}
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.error }]}
              onPress={handleAddExpense}
            >
              <Text style={styles.submitButtonText}>Save Expense</Text>
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
    opacity: 0.08,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
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
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 6,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    marginTop: 4,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  chartCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
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
    marginBottom: 24,
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
  },
  logHeaderLeft: {
    flex: 1,
  },
  logAmount: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  logDate: {
    fontSize: 14,
    marginBottom: 4,
  },
  logCategory: {
    fontSize: 14,
    fontWeight: '600',
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
  },
  categoryText: {
    fontSize: 14,
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
});
