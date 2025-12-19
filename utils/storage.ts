
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TreePlantingLog, EarningsLog, UserProfile, ExpenseLog, Achievement, TreeCountSettings, DaySettings } from '@/types/TreePlanting';
import { Season } from '@/types/Season';
import { ShopStorageService } from './shopStorage';

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
  SEASONS: '@seasons',
  ACTIVE_SEASON: '@active_season',
  SEASON_TREE_LOGS_PREFIX: '@season_tree_logs_',
  SEASON_EARNINGS_LOGS_PREFIX: '@season_earnings_logs_',
  SEASON_EXPENSE_LOGS_PREFIX: '@season_expense_logs_',
  SEASON_ACHIEVEMENTS_PREFIX: '@season_achievements_',
  CAREER_FOREST: '@career_forest',
};

// Helper to get local date string using device's timezone
// This ensures dates are always in YYYY-MM-DD format based on the device's local time
export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to parse a YYYY-MM-DD date string as local date (not UTC)
// This prevents timezone conversion issues
export const parseLocalDate = (dateString: string): Date => {
  // Append 'T00:00:00' to force local timezone interpretation
  return new Date(dateString + 'T00:00:00');
};

export const StorageService = {
  async getTreeLogs(): Promise<TreePlantingLog[]> {
    try {
      const activeSeason = await this.getActiveSeason();
      if (activeSeason) {
        return await this.getSeasonTreeLogs(activeSeason.id);
      }
      
      const data = await AsyncStorage.getItem(KEYS.TREE_LOGS);
      const logs = data ? JSON.parse(data) : [];
      return logs.map((log: TreePlantingLog) => ({
        ...log,
        hourlyLogs: log.hourlyLogs || [],
      }));
    } catch (error) {
      console.error('Error getting tree logs:', error);
      return [];
    }
  },

  async saveTreeLog(log: TreePlantingLog): Promise<void> {
    try {
      const activeSeason = await this.getActiveSeason();
      if (activeSeason) {
        await this.saveSeasonTreeLog(activeSeason.id, log);
        
        const coinsEarned = Math.floor(log.totalTrees / 100);
        if (coinsEarned > 0) {
          await ShopStorageService.addCoins(coinsEarned);
        }
        return;
      }
      
      const logs = await this.getTreeLogs();
      const logWithHourlyLogs = {
        ...log,
        hourlyLogs: log.hourlyLogs || [],
      };
      const existingIndex = logs.findIndex(l => l.id === logWithHourlyLogs.id);
      if (existingIndex >= 0) {
        logs[existingIndex] = logWithHourlyLogs;
      } else {
        logs.push(logWithHourlyLogs);
        
        const coinsEarned = Math.floor(log.totalTrees / 100);
        if (coinsEarned > 0) {
          await ShopStorageService.addCoins(coinsEarned);
        }
      }
      await AsyncStorage.setItem(KEYS.TREE_LOGS, JSON.stringify(logs));
    } catch (error) {
      console.error('Error saving tree log:', error);
    }
  },

  async deleteTreeLog(id: string): Promise<void> {
    try {
      const activeSeason = await this.getActiveSeason();
      if (activeSeason) {
        const logs = await this.getSeasonTreeLogs(activeSeason.id);
        const filtered = logs.filter(log => log.id !== id);
        await AsyncStorage.setItem(`${KEYS.SEASON_TREE_LOGS_PREFIX}${activeSeason.id}`, JSON.stringify(filtered));
        return;
      }
      
      const logs = await this.getTreeLogs();
      const filtered = logs.filter(log => log.id !== id);
      await AsyncStorage.setItem(KEYS.TREE_LOGS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting tree log:', error);
    }
  },

  async deleteHourlyLog(logId: string, hourlyLogId: string): Promise<void> {
    try {
      const activeSeason = await this.getActiveSeason();
      if (activeSeason) {
        const logs = await this.getSeasonTreeLogs(activeSeason.id);
        const log = logs.find(l => l.id === logId);
        if (log) {
          const hourlyLogsArray = log.hourlyLogs || [];
          log.hourlyLogs = hourlyLogsArray.filter(hl => hl.id !== hourlyLogId);
          log.totalTrees = log.hourlyLogs.reduce((sum, hl) => sum + hl.treesPlanted, 0);
          await this.saveSeasonTreeLog(activeSeason.id, log);
        }
        return;
      }
      
      const logs = await this.getTreeLogs();
      const log = logs.find(l => l.id === logId);
      if (log) {
        const hourlyLogsArray = log.hourlyLogs || [];
        log.hourlyLogs = hourlyLogsArray.filter(hl => hl.id !== hourlyLogId);
        log.totalTrees = log.hourlyLogs.reduce((sum, hl) => sum + hl.treesPlanted, 0);
        await this.saveTreeLog(log);
      }
    } catch (error) {
      console.error('Error deleting hourly log:', error);
    }
  },

  async getEarningsLogs(): Promise<EarningsLog[]> {
    try {
      const activeSeason = await this.getActiveSeason();
      if (activeSeason) {
        return await this.getSeasonEarningsLogs(activeSeason.id);
      }
      
      const data = await AsyncStorage.getItem(KEYS.EARNINGS_LOGS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting earnings logs:', error);
      return [];
    }
  },

  async saveEarningsLog(log: EarningsLog): Promise<void> {
    try {
      const activeSeason = await this.getActiveSeason();
      if (activeSeason) {
        await this.saveSeasonEarningsLog(activeSeason.id, log);
        return;
      }
      
      const logs = await this.getEarningsLogs();
      logs.push(log);
      await AsyncStorage.setItem(KEYS.EARNINGS_LOGS, JSON.stringify(logs));
    } catch (error) {
      console.error('Error saving earnings log:', error);
    }
  },

  async deleteEarningsLog(id: string): Promise<void> {
    try {
      const activeSeason = await this.getActiveSeason();
      if (activeSeason) {
        const logs = await this.getSeasonEarningsLogs(activeSeason.id);
        const filtered = logs.filter(log => log.id !== id);
        await AsyncStorage.setItem(`${KEYS.SEASON_EARNINGS_LOGS_PREFIX}${activeSeason.id}`, JSON.stringify(filtered));
        return;
      }
      
      const logs = await this.getEarningsLogs();
      const filtered = logs.filter(log => log.id !== id);
      await AsyncStorage.setItem(KEYS.EARNINGS_LOGS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting earnings log:', error);
    }
  },

  async getExpenseLogs(): Promise<ExpenseLog[]> {
    try {
      const activeSeason = await this.getActiveSeason();
      if (activeSeason) {
        return await this.getSeasonExpenseLogs(activeSeason.id);
      }
      
      const data = await AsyncStorage.getItem(KEYS.EXPENSE_LOGS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting expense logs:', error);
      return [];
    }
  },

  async saveExpenseLog(log: ExpenseLog): Promise<void> {
    try {
      const activeSeason = await this.getActiveSeason();
      if (activeSeason) {
        await this.saveSeasonExpenseLog(activeSeason.id, log);
        return;
      }
      
      const logs = await this.getExpenseLogs();
      logs.push(log);
      await AsyncStorage.setItem(KEYS.EXPENSE_LOGS, JSON.stringify(logs));
    } catch (error) {
      console.error('Error saving expense log:', error);
    }
  },

  async deleteExpenseLog(id: string): Promise<void> {
    try {
      const activeSeason = await this.getActiveSeason();
      if (activeSeason) {
        const logs = await this.getSeasonExpenseLogs(activeSeason.id);
        const filtered = logs.filter(log => log.id !== id);
        await AsyncStorage.setItem(`${KEYS.SEASON_EXPENSE_LOGS_PREFIX}${activeSeason.id}`, JSON.stringify(filtered));
        return;
      }
      
      const logs = await this.getExpenseLogs();
      const filtered = logs.filter(log => log.id !== id);
      await AsyncStorage.setItem(KEYS.EXPENSE_LOGS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting expense log:', error);
    }
  },

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

  async getAchievements(): Promise<Achievement[]> {
    try {
      const activeSeason = await this.getActiveSeason();
      if (activeSeason) {
        return await this.getSeasonAchievements(activeSeason.id);
      }
      
      const data = await AsyncStorage.getItem(KEYS.ACHIEVEMENTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting achievements:', error);
      return [];
    }
  },

  async saveAchievements(achievements: Achievement[]): Promise<void> {
    try {
      const activeSeason = await this.getActiveSeason();
      if (activeSeason) {
        await this.saveSeasonAchievements(activeSeason.id, achievements);
        return;
      }
      
      await AsyncStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
    } catch (error) {
      console.error('Error saving achievements:', error);
    }
  },

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

  async getSeasons(): Promise<Season[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SEASONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting seasons:', error);
      return [];
    }
  },

  async saveSeason(season: Season): Promise<void> {
    try {
      const seasons = await this.getSeasons();
      const existingIndex = seasons.findIndex(s => s.id === season.id);
      if (existingIndex >= 0) {
        seasons[existingIndex] = season;
      } else {
        seasons.push(season);
      }
      await AsyncStorage.setItem(KEYS.SEASONS, JSON.stringify(seasons));
    } catch (error) {
      console.error('Error saving season:', error);
    }
  },

  async getActiveSeason(): Promise<Season | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.ACTIVE_SEASON);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting active season:', error);
      return null;
    }
  },

  async setActiveSeason(season: Season | null): Promise<void> {
    try {
      if (season === null) {
        await AsyncStorage.removeItem(KEYS.ACTIVE_SEASON);
      } else {
        await AsyncStorage.setItem(KEYS.ACTIVE_SEASON, JSON.stringify(season));
      }
    } catch (error) {
      console.error('Error setting active season:', error);
    }
  },

  async createNewSeason(province: string, year: number): Promise<Season> {
    try {
      console.log('Starting createNewSeason...');
      const seasons = await this.getSeasons();
      const activeSeason = await this.getActiveSeason();
      
      if (activeSeason) {
        console.log('Found active season, archiving it...');
        const currentTreeLogs = await this.getSeasonTreeLogs(activeSeason.id);
        const currentEarningsLogs = await this.getSeasonEarningsLogs(activeSeason.id);
        const currentExpenseLogs = await this.getSeasonExpenseLogs(activeSeason.id);
        
        const totalTrees = currentTreeLogs.reduce((sum, log) => sum + log.totalTrees, 0);
        const totalEarnings = currentEarningsLogs.reduce((sum, log) => sum + log.amount, 0);
        const totalExpenses = currentExpenseLogs.reduce((sum, log) => sum + log.amount, 0);
        const totalDays = currentTreeLogs.filter(log => log.dayType !== 'sick' && log.dayType !== 'dayoff').length;
        
        console.log('Current season stats:', { totalTrees, totalEarnings, totalExpenses, totalDays });
        
        activeSeason.isActive = false;
        activeSeason.endDate = new Date().toISOString();
        activeSeason.totalTrees = totalTrees;
        activeSeason.totalEarnings = totalEarnings;
        activeSeason.totalDays = totalDays;
        
        await this.saveSeason(activeSeason);
        console.log('Active season archived successfully');
      }

      const newSeason: Season = {
        id: Date.now().toString(),
        name: `${province} ${year}`,
        province,
        year,
        startDate: new Date().toISOString(),
        isActive: true,
        totalTrees: 0,
        totalEarnings: 0,
        totalDays: 0,
      };

      console.log('Creating new season:', newSeason);
      await this.saveSeason(newSeason);
      await this.setActiveSeason(newSeason);
      
      console.log('New season created and set as active');
      return newSeason;
    } catch (error) {
      console.error('Error creating new season:', error);
      throw error;
    }
  },

  async getSeasonTreeLogs(seasonId: string): Promise<TreePlantingLog[]> {
    try {
      const data = await AsyncStorage.getItem(`${KEYS.SEASON_TREE_LOGS_PREFIX}${seasonId}`);
      const logs = data ? JSON.parse(data) : [];
      return logs.map((log: TreePlantingLog) => ({
        ...log,
        hourlyLogs: log.hourlyLogs || [],
      }));
    } catch (error) {
      console.error('Error getting season tree logs:', error);
      return [];
    }
  },

  async saveSeasonTreeLog(seasonId: string, log: TreePlantingLog): Promise<void> {
    try {
      const logs = await this.getSeasonTreeLogs(seasonId);
      const logWithHourlyLogs = {
        ...log,
        hourlyLogs: log.hourlyLogs || [],
      };
      const existingIndex = logs.findIndex(l => l.id === logWithHourlyLogs.id);
      if (existingIndex >= 0) {
        logs[existingIndex] = logWithHourlyLogs;
      } else {
        logs.push(logWithHourlyLogs);
      }
      await AsyncStorage.setItem(`${KEYS.SEASON_TREE_LOGS_PREFIX}${seasonId}`, JSON.stringify(logs));
    } catch (error) {
      console.error('Error saving season tree log:', error);
    }
  },

  async getSeasonEarningsLogs(seasonId: string): Promise<EarningsLog[]> {
    try {
      const data = await AsyncStorage.getItem(`${KEYS.SEASON_EARNINGS_LOGS_PREFIX}${seasonId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting season earnings logs:', error);
      return [];
    }
  },

  async saveSeasonEarningsLog(seasonId: string, log: EarningsLog): Promise<void> {
    try {
      const logs = await this.getSeasonEarningsLogs(seasonId);
      logs.push(log);
      await AsyncStorage.setItem(`${KEYS.SEASON_EARNINGS_LOGS_PREFIX}${seasonId}`, JSON.stringify(logs));
    } catch (error) {
      console.error('Error saving season earnings log:', error);
    }
  },

  async getSeasonExpenseLogs(seasonId: string): Promise<ExpenseLog[]> {
    try {
      const data = await AsyncStorage.getItem(`${KEYS.SEASON_EXPENSE_LOGS_PREFIX}${seasonId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting season expense logs:', error);
      return [];
    }
  },

  async saveSeasonExpenseLog(seasonId: string, log: ExpenseLog): Promise<void> {
    try {
      const logs = await this.getSeasonExpenseLogs(seasonId);
      logs.push(log);
      await AsyncStorage.setItem(`${KEYS.SEASON_EXPENSE_LOGS_PREFIX}${seasonId}`, JSON.stringify(logs));
    } catch (error) {
      console.error('Error saving season expense log:', error);
    }
  },

  async getSeasonAchievements(seasonId: string): Promise<Achievement[]> {
    try {
      const data = await AsyncStorage.getItem(`${KEYS.SEASON_ACHIEVEMENTS_PREFIX}${seasonId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting season achievements:', error);
      return [];
    }
  },

  async saveSeasonAchievements(seasonId: string, achievements: Achievement[]): Promise<void> {
    try {
      await AsyncStorage.setItem(`${KEYS.SEASON_ACHIEVEMENTS_PREFIX}${seasonId}`, JSON.stringify(achievements));
    } catch (error) {
      console.error('Error saving season achievements:', error);
    }
  },

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
