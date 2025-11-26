
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
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';

export default function ProfileScreen() {
  const { colors, isDark, setThemeMode, themeMode } = useThemeContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [selectedProvince, setSelectedProvince] = useState(PROVINCES[0]);
  const [experienceLevel, setExperienceLevel] = useState<'rookie' | 'highballer' | 'vet'>('rookie');
  const [showProvincePicker, setShowProvincePicker] = useState(false);

  useEffect(() => {
    loadProfile();
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

  const toggleTheme = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newMode = isDark ? 'light' : 'dark';
    await setThemeMode(newMode);
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
      <View style={styles.modalOverlay}>
        <View style={[styles.pickerModal, { backgroundColor: colors.card }]}>
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
            keyExtractor={(item, index) => `province-${item}-${index}`}
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
              <Text style={[styles.cardTitle, { color: colors.text }]}>Settings</Text>
              
              <TouchableOpacity 
                style={styles.settingRow}
                onPress={toggleTheme}
              >
                <View style={styles.settingLeft}>
                  <IconSymbol
                    ios_icon_name={isDark ? "moon.fill" : "sun.max.fill"}
                    android_material_icon_name={isDark ? "dark-mode" : "light-mode"}
                    size={20}
                    color={colors.accent}
                  />
                  <Text style={[styles.settingText, { color: colors.text }]}>
                    {isDark ? 'Dark Mode' : 'Light Mode'}
                  </Text>
                </View>
                <View style={[styles.toggle, { backgroundColor: isDark ? colors.primary : colors.border }]}>
                  <View style={[
                    styles.toggleThumb,
                    { backgroundColor: '#FFFFFF' },
                    isDark && styles.toggleThumbActive
                  ]} />
                </View>
              </TouchableOpacity>
            </View>

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
                    key={`exp-level-${level}-${index}`}
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
});
