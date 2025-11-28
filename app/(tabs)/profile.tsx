
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
import { UserProfile, PROVINCES, EXPERIENCE_LEVELS } from '@/types/TreePlanting';
import { Season } from '@/types/Season';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';
import { formatLargeNumber } from '@/utils/formatNumber';

export default function ProfileScreen() {
  const { colors, isDark, currentTheme } = useThemeContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [showSeasonListModal, setShowSeasonListModal] = useState(false);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [selectedProvince, setSelectedProvince] = useState(PROVINCES[0]);
  const [experienceLevel, setExperienceLevel] = useState<'rookie' | 'highballer' | 'vet'>('rookie');
  const [showProvincePicker, setShowProvincePicker] = useState(false);

  const [newSeasonProvince, setNewSeasonProvince] = useState(PROVINCES[0]);
  const [newSeasonYear, setNewSeasonYear] = useState(new Date().getFullYear().toString());
  const [showNewSeasonProvincePicker, setShowNewSeasonProvincePicker] = useState(false);

  useEffect(() => {
    loadProfile();
    loadSeasons();
  }, []);

  const loadProfile = async () => {
    const savedProfile = await StorageService.getUserProfile();
    if (savedProfile) {
      setProfile(savedProfile);
      setName(savedProfile.name);
      setAge(savedProfile.age.toString());
      setSelectedProvince(savedProfile.province);
      setExperienceLevel(savedProfile.experienceLevel);
    } else {
      setIsEditing(true);
    }
  };

  const loadSeasons = async () => {
    const allSeasons = await StorageService.getSeasons();
    const active = await StorageService.getActiveSeason();
    setSeasons(allSeasons);
    setActiveSeason(active);
  };

  const handleSaveProfile = async () => {
    if (!name || !age) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const ageNum = parseInt(age);
    if (ageNum < 18) {
      Alert.alert('Age Requirement', 'You must be at least 18 years old to use this app');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newProfile: UserProfile = {
      name,
      age: ageNum,
      province: selectedProvince,
      experienceLevel,
      favoriteSpecies: [],
      totalBadges: 0,
      achievements: [],
    };

    await StorageService.saveUserProfile(newProfile);
    setProfile(newProfile);
    setIsEditing(false);
    Alert.alert('Success', 'Profile saved successfully!');
  };

  const handleCreateNewSeason = async () => {
    const year = parseInt(newSeasonYear);
    if (!year || year < 2000 || year > 2100) {
      Alert.alert('Error', 'Please enter a valid year');
      return;
    }

    if (!newSeasonProvince) {
      Alert.alert('Error', 'Please select a province');
      return;
    }

    Alert.alert(
      'Create New Season',
      `Are you sure you want to start a new season for ${newSeasonProvince} ${year}?\n\n⚠️ WARNING: All your current stats, logs, and analytics will be reset for the new season. Your current season will be archived and can be viewed later. Your career forest will be preserved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          style: 'destructive',
          onPress: async () => {
            try {
              const newSeason = await StorageService.createNewSeason(newSeasonProvince, year);
              await loadSeasons();
              setShowSeasonModal(false);
              setNewSeasonProvince(PROVINCES[0]);
              setNewSeasonYear(new Date().getFullYear().toString());
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', `New season created for ${newSeasonProvince} ${year}!`);
            } catch (error) {
              Alert.alert('Error', 'Failed to create new season');
            }
          },
        },
      ]
    );
  };

  const handleViewSeason = async (season: Season) => {
    const treeLogs = await StorageService.getSeasonTreeLogs(season.id);
    const earningsLogs = await StorageService.getSeasonEarningsLogs(season.id);
    const expenseLogs = await StorageService.getSeasonExpenseLogs(season.id);

    const totalTrees = treeLogs.reduce((sum, log) => sum + log.totalTrees, 0);
    const totalEarnings = earningsLogs.reduce((sum, log) => sum + log.amount, 0);
    const totalExpenses = expenseLogs.reduce((sum, log) => sum + log.amount, 0);
    const totalDays = treeLogs.filter(log => log.dayType !== 'sick' && log.dayType !== 'dayoff').length;

    Alert.alert(
      season.name,
      `Total Trees: ${formatLargeNumber(totalTrees)}\nTotal Earnings: $${totalEarnings >= 100000 ? formatLargeNumber(totalEarnings) : totalEarnings.toFixed(2)}\nTotal Expenses: $${totalExpenses >= 100000 ? formatLargeNumber(totalExpenses) : totalExpenses.toFixed(2)}\nPlanting Days: ${totalDays}\n\nStart Date: ${new Date(season.startDate).toLocaleDateString()}\n${season.endDate ? `End Date: ${new Date(season.endDate).toLocaleDateString()}` : 'Active Season'}`,
      [{ text: 'OK' }]
    );
  };

  const handleEraseData = () => {
    Alert.alert(
      'Erase All Data',
      'Are you sure you want to erase all data? This action cannot be undone. All your logs, earnings, and settings will be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Erase Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.eraseAllData();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                'Data Erased',
                'All data has been successfully erased. The app will now restart.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setProfile(null);
                      setIsEditing(true);
                      setName('');
                      setAge('');
                      setSelectedProvince(PROVINCES[0]);
                      setExperienceLevel('rookie');
                      setSeasons([]);
                      setActiveSeason(null);
                    },
                  },
                ]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to erase data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getExperienceLevelDisplay = (level: 'rookie' | 'highballer' | 'vet') => {
    const displayMap = {
      rookie: 'Rookie',
      highballer: 'High Baller',
      vet: 'Vet',
    };
    return displayMap[level];
  };

  const renderProvincePicker = () => (
    <Modal visible={showProvincePicker} transparent animationType="slide">
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setShowProvincePicker(false)}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          style={[styles.pickerModal, { backgroundColor: colors.card }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Province</Text>
            <TouchableOpacity onPress={() => setShowProvincePicker(false)}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="close"
                size={28}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
          <FlatList
            data={PROVINCES}
            keyExtractor={(item, index) => `province-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  { borderBottomColor: colors.border },
                  item === selectedProvince && { backgroundColor: colors.highlight },
                ]}
                onPress={() => {
                  setSelectedProvince(item);
                  setShowProvincePicker(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    { color: colors.text },
                    item === selectedProvince && { fontWeight: '600', color: colors.primary },
                  ]}
                >
                  {item}
                </Text>
                {item === selectedProvince && (
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

  const renderNewSeasonProvincePicker = () => (
    <Modal visible={showNewSeasonProvincePicker} transparent animationType="slide">
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setShowNewSeasonProvincePicker(false)}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          style={[styles.pickerModal, { backgroundColor: colors.card }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Province</Text>
            <TouchableOpacity onPress={() => setShowNewSeasonProvincePicker(false)}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="close"
                size={28}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
          <FlatList
            data={PROVINCES}
            keyExtractor={(item, index) => `new-season-province-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  { borderBottomColor: colors.border },
                  item === newSeasonProvince && { backgroundColor: colors.highlight },
                ]}
                onPress={() => {
                  setNewSeasonProvince(item);
                  setShowNewSeasonProvincePicker(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    { color: colors.text },
                    item === newSeasonProvince && { fontWeight: '600', color: colors.primary },
                  ]}
                >
                  {item}
                </Text>
                {item === newSeasonProvince && (
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

  const canToggleTheme = !currentTheme.forcedMode;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
      >
        <View style={styles.header}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
            <IconSymbol
              ios_icon_name="person.fill"
              android_material_icon_name="person"
              size={60}
              color="#FFFFFF"
            />
          </View>
          {profile && !isEditing && (
            <>
              <Text style={[styles.profileName, { color: colors.text }]}>{profile.name}</Text>
              <Text style={[styles.profileInfo, { color: colors.textSecondary }]}>
                {profile.age} years • {profile.province}
              </Text>
              {activeSeason && (
                <Text style={[styles.profileSeason, { color: colors.primary }]}>
                  Current Season: {activeSeason.name}
                </Text>
              )}
            </>
          )}
        </View>

        {!isEditing && profile ? (
          <View>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Profile Information</Text>
              
              <View style={styles.infoRow}>
                <IconSymbol
                  ios_icon_name="person.fill"
                  android_material_icon_name="person"
                  size={20}
                  color={colors.primary}
                />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Name</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{profile.name}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="cake"
                  size={20}
                  color={colors.accent}
                />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Age</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{profile.age} years</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <IconSymbol
                  ios_icon_name="map.fill"
                  android_material_icon_name="location-on"
                  size={20}
                  color={colors.secondary}
                />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Province</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{profile.province}</Text>
                </View>
              </View>

              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <IconSymbol
                  ios_icon_name="star.fill"
                  android_material_icon_name="star"
                  size={20}
                  color={colors.accent}
                />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Experience Level</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {getExperienceLevelDisplay(profile.experienceLevel)}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.primary }]}
              onPress={() => setIsEditing(true)}
            >
              <IconSymbol
                ios_icon_name="pencil"
                android_material_icon_name="edit"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Season Management</Text>
              
              <TouchableOpacity 
                style={[styles.seasonButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setNewSeasonProvince(PROVINCES[0]);
                  setNewSeasonYear(new Date().getFullYear().toString());
                  setShowSeasonModal(true);
                }}
              >
                <IconSymbol
                  ios_icon_name="plus.circle.fill"
                  android_material_icon_name="add-circle"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.seasonButtonText}>Create New Season</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.seasonButton, { backgroundColor: colors.secondary }]}
                onPress={() => setShowSeasonListModal(true)}
              >
                <IconSymbol
                  ios_icon_name="list.bullet"
                  android_material_icon_name="list"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.seasonButtonText}>View Previous Seasons</Text>
              </TouchableOpacity>
            </View>

            {canToggleTheme && (
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Settings</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                  Theme mode is controlled by your selected theme
                </Text>
              </View>
            )}

            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Data Management</Text>
              
              <TouchableOpacity 
                style={[styles.dangerButton, { backgroundColor: colors.error }]}
                onPress={handleEraseData}
              >
                <IconSymbol
                  ios_icon_name="trash.fill"
                  android_material_icon_name="delete-forever"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.dangerButtonText}>Erase All Data</Text>
              </TouchableOpacity>
              <Text style={[styles.dangerWarning, { color: colors.textSecondary }]}>
                This will permanently delete all your logs, earnings, and settings. This action cannot be undone.
              </Text>
            </View>
          </View>
        ) : (
          <View>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {profile ? 'Edit Profile' : 'Create Your Profile'}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                You must be at least 18 years old to use this app
              </Text>

              <Text style={[styles.label, { color: colors.text }]}>Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Enter your name"
                value={name}
                onChangeText={setName}
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.label, { color: colors.text }]}>Age *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Enter your age (18+)"
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.label, { color: colors.text }]}>Province *</Text>
              <TouchableOpacity
                style={[styles.pickerButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowProvincePicker(true)}
              >
                <Text style={[styles.pickerButtonText, { color: colors.text }]}>{selectedProvince}</Text>
                <IconSymbol
                  ios_icon_name="chevron.down"
                  android_material_icon_name="arrow-drop-down"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>

              <Text style={[styles.label, { color: colors.text }]}>Experience Level *</Text>
              <View style={styles.experienceContainer}>
                {EXPERIENCE_LEVELS.map((level, index) => (
                  <TouchableOpacity
                    key={`exp-level-${index}`}
                    style={[
                      styles.experienceButton,
                      { borderColor: colors.border },
                      experienceLevel === level && { 
                        borderColor: colors.primary, 
                        backgroundColor: colors.highlight 
                      },
                    ]}
                    onPress={() => setExperienceLevel(level)}
                  >
                    <Text
                      style={[
                        styles.experienceText,
                        { color: colors.textSecondary },
                        experienceLevel === level && { color: colors.primary, fontWeight: '600' },
                      ]}
                    >
                      {getExperienceLevelDisplay(level)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveButtonText}>Save Profile</Text>
              </TouchableOpacity>

              {profile && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsEditing(false);
                    loadProfile();
                  }}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {renderProvincePicker()}
      {renderNewSeasonProvincePicker()}

      <Modal
        visible={showSeasonModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Create New Season</Text>
            <TouchableOpacity onPress={() => setShowSeasonModal(false)}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="close"
                size={32}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={[styles.label, { color: colors.text }]}>Province *</Text>
            <TouchableOpacity
              style={[styles.pickerButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowNewSeasonProvincePicker(true)}
            >
              <Text style={[styles.pickerButtonText, { color: colors.text }]}>{newSeasonProvince}</Text>
              <IconSymbol
                ios_icon_name="chevron.down"
                android_material_icon_name="arrow-drop-down"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>

            <Text style={[styles.label, { color: colors.text }]}>Year *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g., 2024"
              keyboardType="numeric"
              value={newSeasonYear}
              onChangeText={setNewSeasonYear}
              placeholderTextColor={colors.textSecondary}
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleCreateNewSeason}
            >
              <Text style={styles.submitButtonText}>Create Season</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showSeasonListModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Previous Seasons</Text>
            <TouchableOpacity onPress={() => setShowSeasonListModal(false)}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="close"
                size={32}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <FlatList
            data={seasons}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.seasonList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.seasonCard,
                  { backgroundColor: colors.card, borderColor: item.isActive ? colors.primary : colors.border },
                ]}
                onPress={() => handleViewSeason(item)}
              >
                <View style={styles.seasonCardHeader}>
                  <Text style={[styles.seasonCardTitle, { color: colors.text }]}>{item.name}</Text>
                  {item.isActive && (
                    <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.seasonCardDate, { color: colors.textSecondary }]}>
                  {new Date(item.startDate).toLocaleDateString()} - {item.endDate ? new Date(item.endDate).toLocaleDateString() : 'Present'}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptySeasons}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="event"
                  size={64}
                  color={colors.textSecondary}
                />
                <Text style={[styles.emptySeasonsText, { color: colors.textSecondary }]}>
                  No seasons yet. Create your first season to get started!
                </Text>
              </View>
            }
          />
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
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 6,
  },
  profileName: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  profileInfo: {
    fontSize: 16,
  },
  profileSeason: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  cardSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  seasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
  seasonButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
    elevation: 3,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerWarning: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
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
  experienceContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  experienceButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  experienceText: {
    fontSize: 13,
    textAlign: 'center',
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  cancelButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 20,
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
  seasonList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  seasonCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  seasonCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  seasonCardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  activeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  seasonCardDate: {
    fontSize: 14,
  },
  emptySeasons: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptySeasonsText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 32,
  },
});
