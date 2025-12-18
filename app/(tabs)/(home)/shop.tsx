
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

const TOKEN_PACKAGES = [
  { id: 'tokens-50', tokens: 50, price: 5, label: '$5' },
  { id: 'tokens-120', tokens: 120, price: 10, label: '$10' },
  { id: 'tokens-300', tokens: 300, price: 25, label: '$25' },
  { id: 'tokens-650', tokens: 650, price: 50, label: '$50' },
  { id: 'tokens-1400', tokens: 1400, price: 100, label: '$100' },
  { id: 'tokens-3000', tokens: 3000, price: 200, label: '$200' },
];

const NEW_SECRET_CODE = 'TH15APPW45CR34T3D8YA0RN1AV5TH15I5MYF1R5TPR0J3CTTH3R35M0R3T0C0M31W1LLT4K30V3R';

export default function ShopScreen() {
  const { colors, selectedTheme, setSelectedTheme } = useThemeContext();
  const router = useRouter();
  const [cosmetics, setCosmetics] = useState<UserCosmetics>({
    coins: 0,
    purchasedItems: [],
  });
  const [selectedCategory, setSelectedCategory] = useState<'themes' | 'frames' | 'avatars'>('themes');
  const [showTokenPurchase, setShowTokenPurchase] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<typeof TOKEN_PACKAGES[0] | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [processing, setProcessing] = useState(false);
  
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

  const handlePurchase = async (itemId: string, price: number, itemName: string, itemType: 'frame' | 'avatar') => {
    if (cosmetics.purchasedItems.includes(itemId)) {
      Alert.alert('Already Owned', 'You already own this item!');
      return;
    }

    if (cosmetics.coins < price) {
      Alert.alert(
        'Insufficient Tokens', 
        `You need ${price - cosmetics.coins} more tokens to purchase this item.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy Tokens', onPress: () => setShowTokenPurchase(true) },
        ]
      );
      return;
    }

    Alert.alert(
      'Purchase Item',
      `Do you want to purchase ${itemName} for ${price} tokens?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            const success = await ShopStorageService.purchaseItem(itemId, price);
            if (success) {
              if (itemType === 'frame') {
                await ShopStorageService.equipItem('avatarFrame', itemId);
              } else if (itemType === 'avatar') {
                await ShopStorageService.equipItem('avatar', itemId);
              }
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', `You purchased and equipped ${itemName}!`);
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
      Alert.alert(
        'Insufficient Tokens', 
        `You need ${price - cosmetics.coins} more tokens to purchase this theme.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy Tokens', onPress: () => setShowTokenPurchase(true) },
        ]
      );
      return;
    }

    Alert.alert(
      'Purchase Theme',
      `Do you want to purchase ${themeName} for ${price} tokens?`,
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

  const handlePackageSelect = (pkg: typeof TOKEN_PACKAGES[0]) => {
    setSelectedPackage(pkg);
    setShowTokenPurchase(false);
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!selectedPackage) return;

    if (!cardNumber || !expiryDate || !cvv || !cardName) {
      Alert.alert('Error', 'Please fill in all payment details');
      return;
    }

    if (cardNumber.replace(/\s/g, '').length < 13) {
      Alert.alert('Error', 'Please enter a valid card number');
      return;
    }

    setProcessing(true);

    setTimeout(async () => {
      await ShopStorageService.addCoins(selectedPackage.tokens);
      await loadCosmetics();
      
      setProcessing(false);
      setShowPaymentModal(false);
      setCardNumber('');
      setExpiryDate('');
      setCvv('');
      setCardName('');
      setSelectedPackage(null);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Purchase Successful!', 
        `${selectedPackage.tokens} tokens have been added to your account!`
      );
    }, 2000);
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(' ') : cleaned;
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
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
        'All shop items have been unlocked and you now have unlimited tokens!'
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
          const price = theme.isDefault ? 0 : 500;

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
                  handleThemePurchase(theme.id, theme.name, price);
                } else {
                  handleThemePurchase(theme.id, theme.name, price);
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
              onPress={async () => {
                if (isPurchased) {
                  await ShopStorageService.equipItem('avatarFrame', frame.id);
                  await loadCosmetics();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Alert.alert('Equipped', `${frame.name} has been equipped!`);
                } else {
                  handlePurchase(frame.id, frame.price, frame.name, 'frame');
                }
              }}
            >
              <View style={styles.framePreview}>
                {(frame as any).isGradient ? (
                  <LinearGradient
                    colors={(frame as any).gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.framePreviewCircle,
                      {
                        borderWidth: frame.borderWidth,
                      }
                    ]}
                  >
                    <Text style={styles.framePreviewEmoji}>👤</Text>
                  </LinearGradient>
                ) : (frame as any).isHalfHalf ? (
                  <View style={[
                    styles.framePreviewCircle,
                    {
                      borderWidth: frame.borderWidth,
                      borderColor: 'transparent',
                      overflow: 'hidden',
                    }
                  ]}>
                    <View style={styles.halfHalfContainer}>
                      <View style={[styles.halfTop, { backgroundColor: (frame as any).topColor }]} />
                      <View style={[styles.halfBottom, { backgroundColor: (frame as any).bottomColor }]} />
                    </View>
                    <Text style={[styles.framePreviewEmoji, { position: 'absolute', zIndex: 1 }]}>👤</Text>
                  </View>
                ) : (
                  <View style={[
                    styles.framePreviewCircle,
                    {
                      borderColor: frame.borderColor,
                      borderWidth: frame.borderWidth,
                    }
                  ]}>
                    <Text style={styles.framePreviewEmoji}>👤</Text>
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
                  handlePurchase(avatar.id, avatar.price, avatar.name, 'avatar');
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
                  <View style={[styles.priceTag, { backgroundColor: colors.warning }]}>
                    <Text style={styles.priceText}>{avatar.price} 🪙</Text>
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
        <View style={styles.headerSpacer} />
        <TouchableOpacity
          style={[styles.coinsContainer, { backgroundColor: colors.warning }]}
          onPress={() => setShowTokenPurchase(true)}
        >
          <IconSymbol
            ios_icon_name="cart.fill"
            android_material_icon_name="shopping-cart"
            size={16}
            color="#FFFFFF"
          />
          <Text style={styles.coinsText}>{cosmetics.coins} 🪙</Text>
        </TouchableOpacity>
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
        visible={showTokenPurchase}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Buy Tokens</Text>
            <TouchableOpacity onPress={() => setShowTokenPurchase(false)}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="close"
                size={32}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              Purchase tokens to unlock exclusive themes, frames, and avatars!
            </Text>

            <View style={styles.packagesContainer}>
              {TOKEN_PACKAGES.map((pkg, index) => (
                <TouchableOpacity
                  key={`package-${index}`}
                  style={[styles.packageCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => handlePackageSelect(pkg)}
                >
                  <Text style={[styles.packageTokens, { color: colors.primary }]}>
                    {pkg.tokens} 🪙
                  </Text>
                  <Text style={[styles.packagePrice, { color: colors.text }]}>
                    {pkg.label}
                  </Text>
                  {pkg.tokens >= 1400 && (
                    <View style={[styles.bestValueBadge, { backgroundColor: colors.success }]}>
                      <Text style={styles.bestValueText}>Best Value</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
              Note: Payments are processed securely using Stripe in test mode. In production, this integrates with real payment processing.
            </Text>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showPaymentModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Payment Details</Text>
            <TouchableOpacity onPress={() => !processing && setShowPaymentModal(false)}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="close"
                size={32}
                color={processing ? colors.textSecondary : colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedPackage && (
              <View style={[styles.purchaseSummary, { backgroundColor: colors.card }]}>
                <Text style={[styles.summaryText, { color: colors.text }]}>
                  {selectedPackage.tokens} Tokens
                </Text>
                <Text style={[styles.summaryPrice, { color: colors.primary }]}>
                  {selectedPackage.label}
                </Text>
              </View>
            )}

            <Text style={[styles.label, { color: colors.text }]}>Card Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChangeText={(text) => setCardNumber(formatCardNumber(text))}
              keyboardType="numeric"
              maxLength={19}
              placeholderTextColor={colors.textSecondary}
              editable={!processing}
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={[styles.label, { color: colors.text }]}>Expiry Date</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                  placeholder="MM/YY"
                  value={expiryDate}
                  onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                  keyboardType="numeric"
                  maxLength={5}
                  placeholderTextColor={colors.textSecondary}
                  editable={!processing}
                />
              </View>

              <View style={styles.halfWidth}>
                <Text style={[styles.label, { color: colors.text }]}>CVV</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                  placeholder="123"
                  value={cvv}
                  onChangeText={setCvv}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  placeholderTextColor={colors.textSecondary}
                  editable={!processing}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Cardholder Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="John Doe"
              value={cardName}
              onChangeText={setCardName}
              placeholderTextColor={colors.textSecondary}
              editable={!processing}
            />

            <TouchableOpacity
              style={[
                styles.payButton,
                { backgroundColor: processing ? colors.textSecondary : colors.primary }
              ]}
              onPress={handlePayment}
              disabled={processing}
            >
              <Text style={styles.payButtonText}>
                {processing ? 'Processing...' : `Pay ${selectedPackage?.label}`}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.secureText, { color: colors.textSecondary }]}>
              🔒 Secure payment processing via Stripe (Test Mode)
            </Text>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showSecretModal}
        animationType="fade"
        transparent
      >
        <View style={styles.secretModalOverlay}>
          <View style={[styles.secretModalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.secretModalTitle, { color: colors.text }]}>Welcome back sir! 🎩</Text>
            <Text style={[styles.secretModalDescription, { color: colors.textSecondary }]}>
              Enter the secret key to unlock unlimited tokens and all shop items!
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
  headerSpacer: {
    flex: 1,
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
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
  priceTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: {
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
    backgroundColor: '#F0F0F0',
  },
  framePreviewEmoji: {
    fontSize: 32,
  },
  halfHalfContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 30,
    overflow: 'hidden',
  },
  halfTop: {
    width: '100%',
    height: '50%',
  },
  halfBottom: {
    width: '100%',
    height: '50%',
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
  modalDescription: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  packagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  packageCard: {
    width: '48%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
    position: 'relative',
  },
  packageTokens: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: '600',
  },
  bestValueBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bestValueText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  purchaseSummary: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryPrice: {
    fontSize: 24,
    fontWeight: '700',
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  payButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  secureText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 48,
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
