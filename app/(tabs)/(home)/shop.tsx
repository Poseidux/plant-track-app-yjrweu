
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { ShopStorageService } from '@/utils/shopStorage';
import { UserCosmetics, AVATAR_FRAMES, PROFILE_ICONS, PROFILE_EMOJIS } from '@/types/Shop';
import { APP_THEMES } from '@/constants/Themes';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

export default function ShopScreen() {
  const { colors, selectedTheme, setSelectedTheme } = useThemeContext();
  const router = useRouter();
  const [cosmetics, setCosmetics] = useState<UserCosmetics>({
    coins: 0,
    purchasedItems: [],
  });
  const [selectedCategory, setSelectedCategory] = useState<'themes' | 'frames' | 'icons' | 'emojis'>('themes');

  useEffect(() => {
    loadCosmetics();
  }, []);

  const loadCosmetics = async () => {
    const data = await ShopStorageService.getUserCosmetics();
    setCosmetics(data);
  };

  const handlePurchase = async (itemId: string, price: number, itemName: string) => {
    if (cosmetics.purchasedItems.includes(itemId)) {
      Alert.alert('Already Owned', 'You already own this item!');
      return;
    }

    if (cosmetics.coins < price) {
      Alert.alert('Insufficient Coins', `You need ${price - cosmetics.coins} more coins to purchase this item.`);
      return;
    }

    Alert.alert(
      'Purchase Item',
      `Do you want to purchase ${itemName} for ${price} coins?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            const success = await ShopStorageService.purchaseItem(itemId, price);
            if (success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', `You purchased ${itemName}!`);
              await loadCosmetics();
            } else {
              Alert.alert('Error', 'Failed to purchase item');
            }
          },
        },
      ]
    );
  };

  const handleThemePurchase = async (themeId: string, themeName: string, price: number) => {
    if (cosmetics.purchasedItems.includes(`theme-${themeId}`)) {
      await setSelectedTheme(themeId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Theme Applied', `${themeName} theme has been applied!`);
      return;
    }

    if (cosmetics.coins < price) {
      Alert.alert('Insufficient Coins', `You need ${price - cosmetics.coins} more coins to purchase this theme.`);
      return;
    }

    Alert.alert(
      'Purchase Theme',
      `Do you want to purchase ${themeName} for ${price} coins?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            const success = await ShopStorageService.purchaseItem(`theme-${themeId}`, price);
            if (success) {
              await setSelectedTheme(themeId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', `You purchased and applied ${themeName}!`);
              await loadCosmetics();
            } else {
              Alert.alert('Error', 'Failed to purchase theme');
            }
          },
        },
      ]
    );
  };

  const renderThemes = () => {
    const premiumThemes = APP_THEMES.filter(t => t.id !== 'default');
    
    return (
      <View style={styles.itemsContainer}>
        {premiumThemes.map((theme, index) => {
          const themeItemId = `theme-${theme.id}`;
          const isPurchased = cosmetics.purchasedItems.includes(themeItemId);
          const isEquipped = selectedTheme === theme.id;
          const price = 500;

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
                if (isPurchased || theme.id === 'default') {
                  handleThemePurchase(theme.id, theme.name, price);
                } else {
                  handleThemePurchase(theme.id, theme.name, price);
                }
              }}
            >
              <View style={styles.itemHeader}>
                <Text style={[styles.itemName, { color: theme.colors.text }]}>{theme.name}</Text>
                {isEquipped && (
                  <View style={[styles.equippedBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.equippedText}>Equipped</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.itemDescription, { color: theme.colors.textSecondary }]}>
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
                  <View style={[styles.priceTag, { backgroundColor: colors.warning }]}>
                    <Text style={styles.priceText}>{price} 🪙</Text>
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
              onPress={() => {
                if (isPurchased) {
                  ShopStorageService.equipItem('avatarFrame', frame.id);
                  loadCosmetics();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } else {
                  handlePurchase(frame.id, frame.price, frame.name);
                }
              }}
            >
              <Text style={styles.itemEmoji}>{frame.emoji}</Text>
              <Text style={[styles.itemName, { color: colors.text }]}>{frame.name}</Text>
              {isEquipped && (
                <View style={[styles.equippedBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.equippedText}>Equipped</Text>
                </View>
              )}
              <View style={styles.itemFooter}>
                {isPurchased ? (
                  <Text style={[styles.ownedText, { color: colors.success }]}>✓ Owned</Text>
                ) : (
                  <View style={[styles.priceTag, { backgroundColor: colors.warning }]}>
                    <Text style={styles.priceText}>{frame.price} 🪙</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderIcons = () => {
    return (
      <View style={styles.itemsContainer}>
        {PROFILE_ICONS.map((icon, index) => {
          const isPurchased = cosmetics.purchasedItems.includes(icon.id);
          const isEquipped = cosmetics.equippedIcon === icon.id;

          return (
            <TouchableOpacity
              key={`icon-${index}`}
              style={[
                styles.shopItem,
                { 
                  backgroundColor: colors.card,
                  borderColor: isEquipped ? colors.primary : colors.border,
                  borderWidth: isEquipped ? 3 : 1,
                },
              ]}
              onPress={() => {
                if (isPurchased) {
                  ShopStorageService.equipItem('icon', icon.id);
                  loadCosmetics();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } else {
                  handlePurchase(icon.id, icon.price, icon.name);
                }
              }}
            >
              <Text style={styles.itemEmoji}>{icon.emoji}</Text>
              <Text style={[styles.itemName, { color: colors.text }]}>{icon.name}</Text>
              {isEquipped && (
                <View style={[styles.equippedBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.equippedText}>Equipped</Text>
                </View>
              )}
              <View style={styles.itemFooter}>
                {isPurchased ? (
                  <Text style={[styles.ownedText, { color: colors.success }]}>✓ Owned</Text>
                ) : (
                  <View style={[styles.priceTag, { backgroundColor: colors.warning }]}>
                    <Text style={styles.priceText}>{icon.price} 🪙</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderEmojis = () => {
    return (
      <View style={styles.itemsContainer}>
        {PROFILE_EMOJIS.map((emoji, index) => {
          const isPurchased = cosmetics.purchasedItems.includes(emoji.id);
          const isEquipped = cosmetics.equippedEmoji === emoji.id;

          return (
            <TouchableOpacity
              key={`emoji-${index}`}
              style={[
                styles.shopItem,
                { 
                  backgroundColor: colors.card,
                  borderColor: isEquipped ? colors.primary : colors.border,
                  borderWidth: isEquipped ? 3 : 1,
                },
              ]}
              onPress={() => {
                if (isPurchased) {
                  ShopStorageService.equipItem('emoji', emoji.id);
                  loadCosmetics();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } else {
                  handlePurchase(emoji.id, emoji.price, emoji.name);
                }
              }}
            >
              <Text style={styles.itemEmoji}>{emoji.emoji}</Text>
              <Text style={[styles.itemName, { color: colors.text }]}>{emoji.name}</Text>
              {isEquipped && (
                <View style={[styles.equippedBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.equippedText}>Equipped</Text>
                </View>
              )}
              <View style={styles.itemFooter}>
                {isPurchased ? (
                  <Text style={[styles.ownedText, { color: colors.success }]}>✓ Owned</Text>
                ) : (
                  <View style={[styles.priceTag, { backgroundColor: colors.warning }]}>
                    <Text style={styles.priceText}>{emoji.price} 🪙</Text>
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
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Shop</Text>
        </View>
        <View style={[styles.coinsContainer, { backgroundColor: colors.warning }]}>
          <Text style={styles.coinsText}>{cosmetics.coins} 🪙</Text>
        </View>
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
            { backgroundColor: selectedCategory === 'icons' ? colors.primary : colors.card },
          ]}
          onPress={() => setSelectedCategory('icons')}
        >
          <Text
            style={[
              styles.categoryText,
              { color: selectedCategory === 'icons' ? '#FFFFFF' : colors.text },
            ]}
          >
            Icons
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.categoryButton,
            { backgroundColor: selectedCategory === 'emojis' ? colors.primary : colors.card },
          ]}
          onPress={() => setSelectedCategory('emojis')}
        >
          <Text
            style={[
              styles.categoryText,
              { color: selectedCategory === 'emojis' ? '#FFFFFF' : colors.text },
            ]}
          >
            Emojis
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {selectedCategory === 'themes' && renderThemes()}
        {selectedCategory === 'frames' && renderFrames()}
        {selectedCategory === 'icons' && renderIcons()}
        {selectedCategory === 'emojis' && renderEmojis()}

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
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  coinsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  coinsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
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
    padding: 16,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 4,
  },
  itemEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  themeColors: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  themeColorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  itemFooter: {
    marginTop: 8,
  },
  priceTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ownedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  equippedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  equippedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 20,
  },
});
