
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
import { Stack } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { StorageService } from '@/utils/storage';
import { UserProfile, PROVINCES } from '@/types/TreePlanting';
import { IconSymbol } from '@/components/IconSymbol';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [selectedProvince, setSelectedProvince] = useState(PROVINCES[0]);
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
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

    const newProfile: UserProfile = {
      name,
      age: parseInt(age),
      province: selectedProvince,
      experienceLevel,
      favoriteSpecies: [],
    };

    await StorageService.saveUserProfile(newProfile);
    setProfile(newProfile);
    setIsEditing(false);
    Alert.alert('Success', 'Profile saved successfully!');
  };

  const renderProvincePicker = () => (
    <Modal visible={showProvincePicker} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.pickerModal}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Province</Text>
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
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  item === selectedProvince && styles.pickerItemSelected,
                ]}
                onPress={() => {
                  setSelectedProvince(item);
                  setShowProvincePicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    item === selectedProvince && styles.pickerItemTextSelected,
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
    <>
      <Stack.Screen
        options={{
          title: 'Profile',
          headerLargeTitle: true,
          headerRight: profile && !isEditing ? () => (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Edit</Text>
            </TouchableOpacity>
          ) : undefined,
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <IconSymbol
                ios_icon_name="person.circle.fill"
                android_material_icon_name="account-circle"
                size={80}
                color={colors.primary}
              />
            </View>
            {profile && !isEditing && (
              <>
                <Text style={styles.profileName}>{profile.name}</Text>
                <Text style={styles.profileInfo}>
                  {profile.age} years • {profile.province}
                </Text>
              </>
            )}
          </View>

          {!isEditing && profile ? (
            <View>
              <View style={commonStyles.card}>
                <Text style={commonStyles.cardTitle}>Profile Information</Text>
                
                <View style={styles.infoRow}>
                  <IconSymbol
                    ios_icon_name="person.fill"
                    android_material_icon_name="person"
                    size={20}
                    color={colors.primary}
                  />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Name</Text>
                    <Text style={styles.infoValue}>{profile.name}</Text>
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
                    <Text style={styles.infoLabel}>Age</Text>
                    <Text style={styles.infoValue}>{profile.age} years</Text>
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
                    <Text style={styles.infoLabel}>Province</Text>
                    <Text style={styles.infoValue}>{profile.province}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <IconSymbol
                    ios_icon_name="star.fill"
                    android_material_icon_name="star"
                    size={20}
                    color={colors.accent}
                  />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Experience Level</Text>
                    <Text style={styles.infoValue}>
                      {profile.experienceLevel.charAt(0).toUpperCase() + profile.experienceLevel.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[commonStyles.card, styles.subscriptionCard]}>
                <Text style={commonStyles.cardTitle}>💎 Premium Subscription</Text>
                <Text style={styles.subscriptionText}>
                  Unlock advanced features with our premium subscription for just $4/month!
                </Text>
                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check-circle"
                      size={20}
                      color={colors.secondary}
                    />
                    <Text style={styles.featureText}>Advanced analytics and reports</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check-circle"
                      size={20}
                      color={colors.secondary}
                    />
                    <Text style={styles.featureText}>Offline mode with sync</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check-circle"
                      size={20}
                      color={colors.secondary}
                    />
                    <Text style={styles.featureText}>Export detailed reports</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check-circle"
                      size={20}
                      color={colors.secondary}
                    />
                    <Text style={styles.featureText}>Priority support</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[buttonStyles.accentButton, styles.subscribeButton]}
                  onPress={() => Alert.alert('Coming Soon', 'Subscription feature will be available soon!')}
                >
                  <Text style={buttonStyles.buttonText}>Subscribe Now - $4/month</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <View style={commonStyles.card}>
                <Text style={commonStyles.cardTitle}>
                  {profile ? 'Edit Profile' : 'Create Your Profile'}
                </Text>

                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={commonStyles.input}
                  placeholder="Enter your name"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={styles.label}>Age *</Text>
                <TextInput
                  style={commonStyles.input}
                  placeholder="Enter your age"
                  keyboardType="numeric"
                  value={age}
                  onChangeText={setAge}
                  placeholderTextColor={colors.textSecondary}
                />

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

                <Text style={styles.label}>Experience Level *</Text>
                <View style={styles.experienceContainer}>
                  {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.experienceButton,
                        experienceLevel === level && styles.experienceButtonActive,
                      ]}
                      onPress={() => setExperienceLevel(level)}
                    >
                      <Text
                        style={[
                          styles.experienceText,
                          experienceLevel === level && styles.experienceTextActive,
                        ]}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[buttonStyles.primaryButton, styles.saveButton]}
                  onPress={handleSaveProfile}
                >
                  <Text style={buttonStyles.buttonText}>Save Profile</Text>
                </TouchableOpacity>

                {profile && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setIsEditing(false);
                      loadProfile();
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </ScrollView>

        {renderProvincePicker()}
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
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  profileName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  profileInfo: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  subscriptionCard: {
    marginTop: 16,
  },
  subscriptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  featuresList: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  subscribeButton: {
    marginTop: 8,
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
  experienceContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  experienceButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  experienceButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  experienceText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  experienceTextActive: {
    color: colors.primary,
  },
  saveButton: {
    marginTop: 8,
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
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
