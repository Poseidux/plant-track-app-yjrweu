
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TreePlantingLog, EarningsLog, UserProfile, ExpenseLog, Achievement, TreeCountSettings, DaySettings } from '@/types/TreePlanting';

const KEYS = {
  TREE_LOGS: '@tree_planting_logs',
  EARNINGS_LOGS: '@earnings_logs',
  EXPENSE_LOGS: '@expense_logs',
  USER_PROFILE: '@user_profile',
  THEME_MODE: '@theme_mode',
  ACHIEVEMENTS: '@achievements',
  TREE_COUNT_SETTINGS: '@tree_count_settings',
  SELECTED_THEME: '@selected_theme',
  DAY_SETTINGS_PREFIX: '@day_settings_',
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
      const existingIndex = logs.findIndex(l => l.id === log.id);
      if (existingIndex >= 0) {
        logs[existingIndex] = log;
      } else {
        logs.push(log);
      }
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

  async deleteHourlyLog(logId: string, hourlyLogId: string): Promise<void> {
    try {
      const logs = await this.getTreeLogs();
      const log = logs.find(l => l.id === logId);
      if (log) {
        log.hourlyLogs = log.hourlyLogs.filter(hl => hl.id !== hourlyLogId);
        log.totalTrees = log.hourlyLogs.reduce((sum, hl) => sum + hl.treesPlanted, 0);
        await this.saveTreeLog(log);
      }
    } catch (error) {
      console.error('Error deleting hourly log:', error);
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

  // Expense Logs
  async getExpenseLogs(): Promise<ExpenseLog[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.EXPENSE_LOGS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting expense logs:', error);
      return [];
    }
  },

  async saveExpenseLog(log: ExpenseLog): Promise<void> {
    try {
      const logs = await this.getExpenseLogs();
      logs.push(log);
      await AsyncStorage.setItem(KEYS.EXPENSE_LOGS, JSON.stringify(logs));
    } catch (error) {
      console.error('Error saving expense log:', error);
    }
  },

  async deleteExpenseLog(id: string): Promise<void> {
    try {
      const logs = await this.getExpenseLogs();
      const filtered = logs.filter(log => log.id !== id);
      await AsyncStorage.setItem(KEYS.EXPENSE_LOGS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting expense log:', error);
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

  // Theme Mode
  async getThemeMode(): Promise<'light' | 'dark'> {
    try {
      const mode = await AsyncStorage.getItem(KEYS.THEME_MODE);
      return (mode as 'light' | 'dark') || 'light';
    } catch (error) {
      console.error('Error getting theme mode:', error);
      return 'light';
    }
  },

  async saveThemeMode(mode: 'light' | 'dark'): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.THEME_MODE, mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  },

  // Achievements
  async getAchievements(): Promise<Achievement[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.ACHIEVEMENTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting achievements:', error);
      return [];
    }
  },

  async saveAchievements(achievements: Achievement[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
    } catch (error) {
      console.error('Error saving achievements:', error);
    }
  },

  // Tree Count Settings
  async getTreeCountSettings(): Promise<TreeCountSettings> {
    try {
      const data = await AsyncStorage.getItem(KEYS.TREE_COUNT_SETTINGS);
      return data ? JSON.parse(data) : { treesPerBundle: 100, treesPerBox: 50, treesPerTray: 25 };
    } catch (error) {
      console.error('Error getting tree count settings:', error);
      return { treesPerBundle: 100, treesPerBox: 50, treesPerTray: 25 };
    }
  },

  async saveTreeCountSettings(settings: TreeCountSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.TREE_COUNT_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving tree count settings:', error);
    }
  },

  // Day Settings (per-day settings)
  async getDaySettings(date: string): Promise<DaySettings | null> {
    try {
      const data = await AsyncStorage.getItem(`${KEYS.DAY_SETTINGS_PREFIX}${date}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting day settings:', error);
      return null;
    }
  },

  async saveDaySettings(date: string, settings: DaySettings): Promise<void> {
    try {
      await AsyncStorage.setItem(`${KEYS.DAY_SETTINGS_PREFIX}${date}`, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving day settings:', error);
    }
  },

  // Selected Theme
  async getSelectedTheme(): Promise<string> {
    try {
      const theme = await AsyncStorage.getItem(KEYS.SELECTED_THEME);
      return theme || 'default';
    } catch (error) {
      console.error('Error getting selected theme:', error);
      return 'default';
    }
  },

  async saveSelectedTheme(theme: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.SELECTED_THEME, theme);
    } catch (error) {
      console.error('Error saving selected theme:', error);
    }
  },

  // Erase All Data
  async eraseAllData(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToRemove = allKeys.filter(key => 
        key.startsWith('@') && key !== KEYS.THEME_MODE && key !== KEYS.SELECTED_THEME
      );
      await AsyncStorage.multiRemove(keysToRemove);
      console.log('All data erased successfully');
    } catch (error) {
      console.error('Error erasing all data:', error);
      throw error;
    }
  },
};
