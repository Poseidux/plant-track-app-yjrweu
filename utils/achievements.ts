
import { Achievement, TreePlantingLog, EarningsLog } from '@/types/TreePlanting';

export const ACHIEVEMENT_DEFINITIONS = [
  {
    id: 'first_tree',
    title: 'First Seedling',
    description: 'Plant your first tree',
    icon: 'leaf.fill',
    target: 1,
    checkProgress: (trees: number) => trees >= 1,
  },
  {
    id: 'hundred_trees',
    title: '100 Trees',
    description: 'Plant 100 trees',
    icon: 'tree.fill',
    target: 100,
    checkProgress: (trees: number) => trees >= 100,
  },
  {
    id: 'thousand_trees',
    title: '1,000 Trees',
    description: 'Plant 1,000 trees',
    icon: 'tree.circle.fill',
    target: 1000,
    checkProgress: (trees: number) => trees >= 1000,
  },
  {
    id: 'ten_thousand_trees',
    title: '10,000 Trees',
    description: 'Plant 10,000 trees',
    icon: 'sparkles',
    target: 10000,
    checkProgress: (trees: number) => trees >= 10000,
  },
  {
    id: 'first_earnings',
    title: 'First Paycheck',
    description: 'Earn your first dollar',
    icon: 'dollarsign.circle.fill',
    target: 1,
    checkProgress: (trees: number, earnings: number) => earnings >= 1,
  },
  {
    id: 'thousand_earnings',
    title: '$1,000 Earned',
    description: 'Earn $1,000',
    icon: 'banknote.fill',
    target: 1000,
    checkProgress: (trees: number, earnings: number) => earnings >= 1000,
  },
  {
    id: 'week_streak',
    title: 'Week Warrior',
    description: 'Log trees for 7 consecutive days',
    icon: 'calendar.badge.clock',
    target: 7,
    checkProgress: (trees: number, earnings: number, days: number) => days >= 7,
  },
  {
    id: 'month_streak',
    title: 'Monthly Master',
    description: 'Log trees for 30 consecutive days',
    icon: 'calendar.circle.fill',
    target: 30,
    checkProgress: (trees: number, earnings: number, days: number) => days >= 30,
  },
];

export function checkAndUnlockAchievements(
  treeLogs: TreePlantingLog[],
  earningsLogs: EarningsLog[],
  currentAchievements: Achievement[]
): Achievement[] {
  const totalTrees = treeLogs.reduce((sum, log) => sum + log.totalTrees, 0);
  const totalEarnings = earningsLogs.reduce((sum, log) => sum + log.amount, 0);
  const totalDays = treeLogs.length;

  const newAchievements: Achievement[] = [];

  ACHIEVEMENT_DEFINITIONS.forEach(def => {
    const existing = currentAchievements.find(a => a.id === def.id);
    if (!existing) {
      const unlocked = def.checkProgress(totalTrees, totalEarnings, totalDays);
      if (unlocked) {
        newAchievements.push({
          id: def.id,
          title: def.title,
          description: def.description,
          icon: def.icon,
          unlockedAt: new Date().toISOString(),
          progress: def.target,
          target: def.target,
        });
      }
    }
  });

  return [...currentAchievements, ...newAchievements];
}
