
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserCosmetics, ShopItem } from '@/types/Shop';

const KEYS = {
  USER_COSMETICS: '@user_cosmetics',
};

export const ShopStorageService = {
  async getUserCosmetics(): Promise<UserCosmetics> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_COSMETICS);
      return data ? JSON.parse(data) : {
        coins: 0,
        purchasedItems: [],
      };
    } catch (error) {
      console.error('Error getting user cosmetics:', error);
      return {
        coins: 0,
        purchasedItems: [],
      };
    }
  },

  async saveUserCosmetics(cosmetics: UserCosmetics): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.USER_COSMETICS, JSON.stringify(cosmetics));
    } catch (error) {
      console.error('Error saving user cosmetics:', error);
    }
  },

  async addCoins(amount: number): Promise<void> {
    try {
      const cosmetics = await this.getUserCosmetics();
      cosmetics.coins += amount;
      await this.saveUserCosmetics(cosmetics);
    } catch (error) {
      console.error('Error adding coins:', error);
    }
  },

  async purchaseItem(itemId: string, price: number): Promise<boolean> {
    try {
      const cosmetics = await this.getUserCosmetics();
      
      if (cosmetics.coins < price) {
        return false;
      }
      
      if (cosmetics.purchasedItems.includes(itemId)) {
        return false;
      }
      
      cosmetics.coins -= price;
      cosmetics.purchasedItems.push(itemId);
      await this.saveUserCosmetics(cosmetics);
      return true;
    } catch (error) {
      console.error('Error purchasing item:', error);
      return false;
    }
  },

  async equipItem(itemType: 'avatarFrame' | 'avatar', itemId: string): Promise<void> {
    try {
      const cosmetics = await this.getUserCosmetics();
      
      if (itemType === 'avatarFrame') {
        cosmetics.equippedAvatarFrame = itemId;
      } else if (itemType === 'avatar') {
        cosmetics.equippedAvatar = itemId;
      }
      
      await this.saveUserCosmetics(cosmetics);
    } catch (error) {
      console.error('Error equipping item:', error);
    }
  },

  async unlockAllItems(): Promise<void> {
    try {
      const cosmetics = await this.getUserCosmetics();
      cosmetics.coins = 999999;
      
      const allItemIds = [
        'theme-ocean-breeze',
        'theme-ocean-breeze-dark',
        'theme-sunset-glow',
        'theme-sunset-glow-dark',
        'theme-forest-dark',
        'theme-neon-nights',
        'theme-earthy-tones',
        'theme-earthy-tones-dark',
        'theme-arctic-frost',
        'theme-arctic-frost-dark',
        'theme-cherry-blossom',
        'theme-cherry-blossom-dark',
        'theme-midnight-purple',
        'theme-autumn-harvest',
        'theme-autumn-harvest-dark',
        'frame-gold',
        'frame-silver',
        'frame-bronze',
        'frame-diamond',
        'frame-emerald',
        'frame-ruby',
        'frame-sapphire',
        'frame-rainbow',
        'avatar-tree',
        'avatar-leaf',
        'avatar-seedling',
        'avatar-evergreen',
        'avatar-deciduous',
        'avatar-palm',
        'avatar-cactus',
        'avatar-flower',
        'avatar-sunflower',
        'avatar-rose',
        'avatar-tulip',
        'avatar-blossom',
        'avatar-smile',
        'avatar-cool',
        'avatar-star',
        'avatar-love',
        'avatar-party',
        'avatar-fire',
        'avatar-rocket',
        'avatar-trophy',
        'avatar-crown',
        'avatar-gem',
      ];
      
      cosmetics.purchasedItems = [...new Set([...cosmetics.purchasedItems, ...allItemIds])];
      await this.saveUserCosmetics(cosmetics);
    } catch (error) {
      console.error('Error unlocking all items:', error);
    }
  },
};
