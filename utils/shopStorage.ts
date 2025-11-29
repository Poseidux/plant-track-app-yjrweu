
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

  async equipItem(itemType: 'avatarFrame' | 'icon' | 'emoji', itemId: string): Promise<void> {
    try {
      const cosmetics = await this.getUserCosmetics();
      
      if (itemType === 'avatarFrame') {
        cosmetics.equippedAvatarFrame = itemId;
      } else if (itemType === 'icon') {
        cosmetics.equippedIcon = itemId;
      } else if (itemType === 'emoji') {
        cosmetics.equippedEmoji = itemId;
      }
      
      await this.saveUserCosmetics(cosmetics);
    } catch (error) {
      console.error('Error equipping item:', error);
    }
  },
};
