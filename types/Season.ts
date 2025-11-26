
export interface Season {
  id: string;
  name: string;
  province: string;
  year: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  totalTrees: number;
  totalEarnings: number;
  totalDays: number;
}
