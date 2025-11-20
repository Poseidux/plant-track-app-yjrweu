
export interface HourlyLog {
  id: string;
  startTime: string;
  endTime: string;
  treesPlanted: number;
  species?: string;
  landType?: 'prepped' | 'raw';
}

export interface TreePlantingLog {
  id: string;
  date: string;
  hourlyLogs: HourlyLog[];
  totalTrees: number;
  species: string;
  province: string;
  weatherCondition: string;
  notes?: string;
  dayRating?: number;
  averageRate?: number;
}

export interface ExpenseLog {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
}

export interface EarningsLog {
  id: string;
  date: string;
  amount: number;
  paymentType: 'hourly' | 'per-tree';
  treePrice?: number;
  treesPlanted?: number;
  hoursWorked?: number;
  notes?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  progress: number;
  target: number;
}

export interface UserProfile {
  name: string;
  age: number;
  province: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  favoriteSpecies: string[];
  totalBadges: number;
  achievements: Achievement[];
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  totalTrees: number;
  totalEarnings: number;
  rank: number;
}

export const PROVINCES = [
  'Alberta',
  'British Columbia',
  'Manitoba',
  'New Brunswick',
  'Newfoundland and Labrador',
  'Northwest Territories',
  'Nova Scotia',
  'Nunavut',
  'Ontario',
  'Prince Edward Island',
  'Quebec',
  'Saskatchewan',
  'Yukon',
];

export const TREE_SPECIES = [
  'White Spruce',
  'Black Spruce',
  'Jack Pine',
  'Lodgepole Pine',
  'Douglas Fir',
  'Western Red Cedar',
  'Balsam Fir',
  'Red Pine',
  'White Pine',
  'Tamarack',
  'Other',
];

export const WEATHER_CONDITIONS = [
  'Sunny',
  'Partly Cloudy',
  'Cloudy',
  'Rainy',
  'Windy',
  'Hot',
  'Cold',
  'Foggy',
];

export const EXPENSE_CATEGORIES = [
  'Travel',
  'Meals',
  'Accommodation',
  'Equipment',
  'Other',
];

export const LAND_TYPES: Array<'prepped' | 'raw'> = ['prepped', 'raw'];
