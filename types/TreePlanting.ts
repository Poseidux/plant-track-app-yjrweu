
export interface TreePlantingLog {
  id: string;
  date: string;
  treesPlanted: number;
  species: string;
  province: string;
  weatherCondition: string;
  notes?: string;
}

export interface EarningsLog {
  id: string;
  date: string;
  amount: number;
  paymentType: 'hourly' | 'per-tree';
  hoursWorked?: number;
  treesPlanted?: number;
  notes?: string;
}

export interface UserProfile {
  name: string;
  age: number;
  province: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  favoriteSpecies: string[];
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
