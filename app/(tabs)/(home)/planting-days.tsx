
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { StorageService, parseLocalDate } from '@/utils/storage';
import { TreePlantingLog } from '@/types/TreePlanting';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';

export default function PlantingDaysScreen() {
  const { colors } = useThemeContext();
  const router = useRouter();
  const [treeLogs, setTreeLogs] = useState<TreePlantingLog[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const logs = await StorageService.getTreeLogs();
    setTreeLogs(logs);
  };

  const plantingDates = new Set(treeLogs.map(log => log.date));
  const totalPlantingDays = plantingDates.size;

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.calendarDay} />
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hasPlanting = plantingDates.has(dateStr);
      const log = treeLogs.find(l => l.date === dateStr);
      const isSickOrDayOff = log && (log.dayType === 'sick' || log.dayType === 'dayoff');

      days.push(
        <TouchableOpacity
          key={`day-${day}`}
          style={[
            styles.calendarDay,
            hasPlanting && !isSickOrDayOff && { backgroundColor: colors.secondary },
            isSickOrDayOff && { backgroundColor: colors.error },
          ]}
          disabled={!hasPlanting}
        >
          <Text
            style={[
              styles.calendarDayText,
              { color: hasPlanting ? '#FFFFFF' : colors.text },
            ]}
          >
            {day}
          </Text>
          {hasPlanting && log && !isSickOrDayOff && (
            <Text style={styles.calendarDayTrees}>
              {log.totalTrees}
            </Text>
          )}
          {isSickOrDayOff && (
            <Text style={styles.calendarDayLabel}>
              {log.dayType === 'sick' ? 'Sick' : 'Off'}
            </Text>
          )}
        </TouchableOpacity>
      );
    }

    return days;
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={28}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Planting Days</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <IconSymbol
            ios_icon_name="calendar.badge.clock"
            android_material_icon_name="event"
            size={48}
            color={colors.accent}
          />
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {totalPlantingDays}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            Total Planting Days
          </Text>
        </View>

        <View style={[styles.calendarCard, { backgroundColor: colors.card }]}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={previousMonth} style={styles.monthButton}>
              <IconSymbol
                ios_icon_name="chevron.left"
                android_material_icon_name="chevron-left"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
            <Text style={[styles.monthTitle, { color: colors.text }]}>{monthName}</Text>
            <TouchableOpacity onPress={nextMonth} style={styles.monthButton}>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.weekDaysRow}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <Text key={`weekday-${day}-${index}`} style={[styles.weekDayText, { color: colors.textSecondary }]}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {renderCalendar()}
          </View>

          <View style={[styles.legend, { backgroundColor: colors.highlight }]}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.secondary }]} />
              <Text style={[styles.legendText, { color: colors.text }]}>
                Planting day
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
              <Text style={[styles.legendText, { color: colors.text }]}>
                Sick day / Day off
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.recentCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Recent Planting Days</Text>
          {treeLogs.slice(0, 10).map((log, index) => {
            const isSickOrDayOff = log.dayType === 'sick' || log.dayType === 'dayoff';
            
            return (
              <View key={`recent-${log.id}-${index}`} style={[styles.recentItem, { borderBottomColor: colors.border }]}>
                <View style={styles.recentLeft}>
                  <IconSymbol
                    ios_icon_name="calendar"
                    android_material_icon_name="calendar-today"
                    size={20}
                    color={isSickOrDayOff ? colors.error : colors.primary}
                  />
                  <View style={styles.recentInfo}>
                    <Text style={[styles.recentDate, { color: colors.text }]}>
                      {parseLocalDate(log.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                    <Text style={[styles.recentProvince, { color: colors.textSecondary }]}>
                      {log.province} {isSickOrDayOff && `• ${log.dayType === 'sick' ? 'Sick Day' : 'Day Off'}`}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.recentTrees, { color: isSickOrDayOff ? colors.error : colors.secondary }]}>
                  {isSickOrDayOff ? (log.dayType === 'sick' ? 'Sick' : 'Off') : `${log.totalTrees} trees`}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 32,
    marginBottom: 16,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  summaryValue: {
    fontSize: 48,
    fontWeight: '800',
    marginTop: 12,
  },
  summaryLabel: {
    fontSize: 16,
    marginTop: 8,
  },
  calendarCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    width: (Dimensions.get('window').width - 64) / 7,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: (Dimensions.get('window').width - 64) / 7,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 4,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  calendarDayTrees: {
    fontSize: 9,
    color: '#FFFFFF',
    marginTop: 2,
  },
  calendarDayLabel: {
    fontSize: 8,
    color: '#FFFFFF',
    marginTop: 2,
    fontWeight: '600',
  },
  legend: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 13,
  },
  recentCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentInfo: {
    marginLeft: 12,
  },
  recentDate: {
    fontSize: 15,
    fontWeight: '600',
  },
  recentProvince: {
    fontSize: 13,
    marginTop: 2,
  },
  recentTrees: {
    fontSize: 15,
    fontWeight: '700',
  },
  bottomPadding: {
    height: 20,
  },
});
