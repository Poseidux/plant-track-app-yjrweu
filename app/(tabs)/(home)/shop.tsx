
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeContext } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { ShopStorageService } from '@/utils/shopStorage';
import { UserCosmetics, AVATAR_FRAMES, PROFILE_ICONS_EMOJIS } from '@/types/Shop';
import { APP_THEMES } from '@/constants/Themes';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

const NEW_SECRET_CODE = 'TH15APPW45CR34T3D8YA0RN1AV5TH15I5MYF1R5TPR0J3CTTH3R35M0R3T0C0M31W1LLT4K30V3R';

export default function ShopScreen() {
  const { colors, selectedTheme, setSelectedTheme } = useThemeContext();
  const router = useRouter();
  const [cosmetics, setCosmetics] = useState<UserCosmetics>({
    coins: 0,
    purchasedItems: [],
  });
  const [selectedCategory, setSelectedCategory] = useState<'themes' | 'frames' | 'avatars'>('themes');
  
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const [longPressProgress, setLongPressProgress] = useState(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadCosmetics();
    
    return () => {
      if (longPressTimer.current) {
        clearInterval(longPressTimer.current);
        longPressTimer.current = null;
      }
    };
  }, []);

  const loadCosmetics = async () => {
    const data = await ShopStorageService.getUserCosmetics();
    setCosmetics(data);
  };

  const handlePurchase = async (itemId: string, itemName: string, itemType: 'frame' | 'avatar') => {
    if (cosmetics.purchasedItems.includes(itemId)) {
      Alert.alert('Already Owned', 'You already own this item!');
      return;
    }

    Alert.alert(
      'Get Item',
      `Do you want to get ${itemName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Get',
          onPress: async () => {
            const success = await ShopStorageService.purchaseItem(itemId, 0);
            if (success) {
              if (itemType === 'frame') {
                await ShopStorageService.equipItem('avatarFrame', itemId);
              } else if (itemType === 'avatar') {
                await ShopStorageService.equipItem('avatar', itemId);
              }
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', `You got and equipped ${itemName}!`);
              await loadCosmetics();
            } else {
              Alert.alert('Error', 'Failed to get item');
            }
          },
        },
      ]
    );
  };

  const handleThemePurchase = async (themeId: string, themeName: string) => {
    if (cosmetics.purchasedItems.includes(`theme-${themeId}`)) {
      await setSelectedTheme(themeId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Theme Applied', `${themeName} theme has been applied!`);
      return;
    }

    Alert.alert(
      'Get Theme',
      `Do you want to get ${themeName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Get',
          onPress: async () => {
            const success = await ShopStorageService.purchaseItem(`theme-${themeId}`, 0);
            if (success) {
              await setSelectedTheme(themeId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', `You got and applied ${themeName}!`);
              await loadCosmetics();
            } else {
              Alert.alert('Error', 'Failed to get theme');
            }
          },
        },
      ]
    );
  };

  const handleShopLongPressStart = () => {
    console.log('Shop long press started');
    let progress = 0;
    longPressTimer.current = setInterval(() => {
      progress += 1;
      setLongPressProgress(progress);
      if (progress >= 10) {
        if (longPressTimer.current) {
          clearInterval(longPressTimer.current);
          longPressTimer.current = null;
        }
        setLongPressProgress(0);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowSecretModal(true);
      }
    }, 1000);
  };

  const handleShopLongPressEnd = () => {
    console.log('Shop long press ended');
    if (longPressTimer.current) {
      clearInterval(longPressTimer.current);
      longPressTimer.current = null;
    }
    setLongPressProgress(0);
  };

  const handleSecretCodeSubmit = async () => {
    if (secretCode === NEW_SECRET_CODE) {
      await ShopStorageService.unlockAllItems();
      setShowSecretModal(false);
      setSecretCode('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Welcome back sir! 🎉',
        'All shop items have been unlocked!'
      );
      await loadCosmetics();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Invalid Code', 'The code you entered is incorrect.');
    }
  };

  const renderThemes = () => {
    const allThemes = APP_THEMES;
    
    return (
      <View style={styles.itemsContainer}>
        {allThemes.map((theme, index) => {
          const themeItemId = `theme-${theme.id}`;
          const isPurchased = cosmetics.purchasedItems.includes(themeItemId) || theme.isDefault;
          const isEquipped = selectedTheme === theme.id;

          return (
            <TouchableOpacity
              key={`theme-${index}`}
              style={[
                styles.shopItem,
                { 
                  backgroundColor: theme.colors.card,
                  borderColor: isEquipped ? colors.primary : theme.colors.border,
                  borderWidth: isEquipped ? 3 : 1,
                },
              ]}
              onPress={() => {
                if (isPurchased) {
                  handleThemePurchase(theme.id, theme.name);
                } else {
                  handleThemePurchase(theme.id, theme.name);
                }
              }}
            >
              <View style={styles.itemHeader}>
                <Text style={[styles.itemName, { color: theme.colors.text }]} numberOfLines={1}>
                  {theme.name}
                </Text>
                {isEquipped && (
                  <View style={[styles.equippedBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.equippedText}>Equipped</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.itemDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                {theme.description}
              </Text>
              <View style={styles.themeColors}>
                <View style={[styles.themeColorDot, { backgroundColor: theme.colors.primary }]} />
                <View style={[styles.themeColorDot, { backgroundColor: theme.colors.secondary }]} />
                <View style={[styles.themeColorDot, { backgroundColor: theme.colors.accent }]} />
              </View>
              <View style={styles.itemFooter}>
                {isPurchased ? (
                  <Text style={[styles.ownedText, { color: colors.success }]}>✓ Owned</Text>
                ) : (
                  <View style={[styles.freeTag, { backgroundColor: colors.success }]}>
                    <Text style={styles.freeText}>FREE</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderFrames = () => {
    return (
      <View style={styles.itemsContainer}>
        {AVATAR_FRAMES.map((frame, index) => {
          const isPurchased = cosmetics.purchasedItems.includes(frame.id);
          const isEquipped = cosmetics.equippedAvatarFrame === frame.id;

          return (
            <TouchableOpacity
              key={`frame-${index}`}
              style={[
                styles.shopItem,
                { 
                  backgroundColor: colors.card,
                  borderColor: isEquipped ? colors.primary : colors.border,
                  borderWidth: isEquipped ? 3 : 1,
                },
              ]}
              onPress={async () => {
                if (isPurchased) {
                  await ShopStorageService.equipItem('avatarFrame', frame.id);
                  await loadCosmetics();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Alert.alert('Equipped', `${frame.name} has been equipped!`);
                } else {
                  handlePurchase(frame.id, frame.name, 'frame');
                }
              }}
            >
              <View style={styles.framePreview}>
                {(frame as any).isGradient ? (
                  <View style={styles.framePreviewCircle}>
                    <LinearGradient
                      colors={(frame as any).gradientColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.frameGradientBorder,
                        {
                          borderRadius: 30,
                        }
                      ]}
                    >
                      <View style={styles.frameInnerCircle}>
                        <Text style={styles.framePreviewEmoji}>👤</Text>
                      </View>
                    </LinearGradient>
                  </View>
                ) : (frame as any).isHalfHalf ? (
                  <View style={styles.framePreviewCircle}>
                    <View style={styles.halfHalfBorderContainer}>
                      <View style={[styles.halfTopBorder, { backgroundColor: (frame as any).topColor }]} />
                      <View style={[styles.halfBottomBorder, { backgroundColor: (frame as any).bottomColor }]} />
                    </View>
                    <View style={styles.frameInnerCircle}>
                      <Text style={styles.framePreviewEmoji}>👤</Text>
                    </View>
                  </View>
                ) : (
                  <View style={[
                    styles.framePreviewCircle,
                    {
                      borderColor: frame.borderColor,
                      borderWidth: frame.borderWidth,
                    }
                  ]}>
                    <View style={styles.frameInnerCircle}>
                      <Text style={styles.framePreviewEmoji}>👤</Text>
                    </View>
                  </View>
                )}
              </View>
              <View style={styles.itemHeader}>
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>{frame.name}</Text>
                {isEquipped && (
                  <View style={[styles.equippedBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.equippedText}>Equipped</Text>
                  </View>
                )}
              </View>
              <View style={styles.itemFooter}>
                {isPurchased ? (
                  <Text style={[styles.ownedText, { color: colors.success }]}>✓ Owned</Text>
                ) : (
                  <View style={[styles.freeTag, { backgroundColor: colors.success }]}>
                    <Text style={styles.freeText}>FREE</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderAvatars = () => {
    return (
      <View style={styles.itemsContainer}>
        {PROFILE_ICONS_EMOJIS.map((avatar, index) => {
          const isPurchased = cosmetics.purchasedItems.includes(avatar.id);
          const isEquipped = cosmetics.equippedAvatar === avatar.id;

          return (
            <TouchableOpacity
              key={`avatar-${index}`}
              style={[
                styles.shopItem,
                { 
                  backgroundColor: colors.card,
                  borderColor: isEquipped ? colors.primary : colors.border,
                  borderWidth: isEquipped ? 3 : 1,
                },
              ]}
              onPress={async () => {
                if (isPurchased) {
                  await ShopStorageService.equipItem('avatar', avatar.id);
                  await loadCosmetics();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Alert.alert('Equipped', `${avatar.name} has been equipped!`);
                } else {
                  handlePurchase(avatar.id, avatar.name, 'avatar');
                }
              }}
            >
              <Text style={styles.itemEmoji}>{avatar.emoji}</Text>
              <View style={styles.itemHeader}>
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>{avatar.name}</Text>
                {isEquipped && (
                  <View style={[styles.equippedBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.equippedText}>Equipped</Text>
                  </View>
                )}
              </View>
              <View style={styles.itemFooter}>
                {isPurchased ? (
                  <Text style={[styles.ownedText, { color: colors.success }]}>✓ Owned</Text>
                ) : (
                  <View style={[styles.freeTag, { backgroundColor: colors.success }]}>
                    <Text style={styles.freeText}>FREE</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          onLongPress={handleShopLongPressStart}
          onPressOut={handleShopLongPressEnd}
          delayLongPress={100}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color={colors.text}
          />
          {longPressProgress > 0 && (
            <View style={[styles.progressOverlay, { backgroundColor: colors.primary }]}>
              <Text style={styles.progressText}>{10 - longPressProgress}s</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Shop</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.categoryContainer}>
        <TouchableOpacity
          style={[
            styles.categoryButton,
            { backgroundColor: selectedCategory === 'themes' ? colors.primary : colors.card },
          ]}
          onPress={() => setSelectedCategory('themes')}
        >
          <Text
            style={[
              styles.categoryText,
              { color: selectedCategory === 'themes' ? '#FFFFFF' : colors.text },
            ]}
          >
            Themes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.categoryButton,
            { backgroundColor: selectedCategory === 'frames' ? colors.primary : colors.card },
          ]}
          onPress={() => setSelectedCategory('frames')}
        >
          <Text
            style={[
              styles.categoryText,
              { color: selectedCategory === 'frames' ? '#FFFFFF' : colors.text },
            ]}
          >
            Frames
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.categoryButton,
            { backgroundColor: selectedCategory === 'avatars' ? colors.primary : colors.card },
          ]}
          onPress={() => setSelectedCategory('avatars')}
        >
          <Text
            style={[
              styles.categoryText,
              { color: selectedCategory === 'avatars' ? '#FFFFFF' : colors.text },
            ]}
          >
            Avatars
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
      >
        {selectedCategory === 'themes' && renderThemes()}
        {selectedCategory === 'frames' && renderFrames()}
        {selectedCategory === 'avatars' && renderAvatars()}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal
        visible={showSecretModal}
        animationType="fade"
        transparent
      >
        <View style={styles.secretModalOverlay}>
          <View style={[styles.secretModalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.secretModalTitle, { color: colors.text }]}>Welcome back sir! 🎩</Text>
            <Text style={[styles.secretModalDescription, { color: colors.textSecondary }]}>
              Enter the secret key to unlock all shop items instantly!
            </Text>
            <TextInput
              style={[styles.secretInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter secret key"
              value={secretCode}
              onChangeText={setSecretCode}
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
              multiline
            />
            <View style={styles.secretModalButtons}>
              <TouchableOpacity
                style={[styles.secretModalButton, { backgroundColor: colors.textSecondary }]}
                onPress={() => {
                  setShowSecretModal(false);
                  setSecretCode('');
                }}
              >
                <Text style={styles.secretModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secretModalButton, { backgroundColor: colors.primary }]}
                onPress={handleSecretCodeSubmit}
              >
                <Text style={styles.secretModalButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  progressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
    borderRadius: 20,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  itemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  shopItem: {
    width: '48%',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
    minHeight: 180,
  },
  itemHeader: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 8,
  },
  themeColors: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  themeColorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  itemFooter: {
    marginTop: 'auto',
  },
  freeTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  freeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ownedText: {
    fontSize: 13,
    fontWeight: '600',
  },
  equippedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  equippedText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  framePreview: {
    marginBottom: 8,
  },
  framePreviewCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  frameGradientBorder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },
  frameInnerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  framePreviewEmoji: {
    fontSize: 32,
  },
  halfHalfBorderContainer: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  halfTopBorder: {
    width: 60,
    height: 30,
  },
  halfBottomBorder: {
    width: 60,
    height: 30,
  },
  bottomPadding: {
    height: 20,
  },
  secretModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  secretModalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.3)',
    elevation: 8,
  },
  secretModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  secretModalDescription: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  secretInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    marginBottom: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  secretModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secretModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secretModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
