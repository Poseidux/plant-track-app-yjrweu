
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TreePlantingLog, EarningsLog, UserProfile } from '@/types/TreePlanting';

const KEYS = {
  TREE_LOGS: '@tree_planting_logs',
  EARNINGS_LOGS: '@earnings_logs',
  USER_PROFILE: '@user_profile',
};

export const StorageService = {
  // Tree Planting Logs
  async getTreeLogs(): Promise<TreePlantingLog[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.TREE_LOGS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting tree logs:', error);
      return [];
    }
  },

  async saveTreeLog(log: TreePlantingLog): Promise<void> {
    try {
      const logs = await this.getTreeLogs();
      logs.push(log);
      await AsyncStorage.setItem(KEYS.TREE_LOGS, JSON.stringify(logs));
    } catch (error) {
      console.error('Error saving tree log:', error);
    }
  },

  async deleteTreeLog(id: string): Promise<void> {
    try {
      const logs = await this.getTreeLogs();
      const filtered = logs.filter(log => log.id !== id);
      await AsyncStorage.setItem(KEYS.TREE_LOGS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting tree log:', error);
    }
  },

  // Earnings Logs
  async getEarningsLogs(): Promise<EarningsLog[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.EARNINGS_LOGS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting earnings logs:', error);
      return [];
    }
  },

  async saveEarningsLog(log: EarningsLog): Promise<void> {
    try {
      const logs = await this.getEarningsLogs();
      logs.push(log);
      await AsyncStorage.setItem(KEYS.EARNINGS_LOGS, JSON.stringify(logs));
    } catch (error) {
      console.error('Error saving earnings log:', error);
    }
  },

  async deleteEarningsLog(id: string): Promise<void> {
    try {
      const logs = await this.getEarningsLogs();
      const filtered = logs.filter(log => log.id !== id);
      await AsyncStorage.setItem(KEYS.EARNINGS_LOGS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting earnings log:', error);
    }
  },

  // User Profile
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  },
};
