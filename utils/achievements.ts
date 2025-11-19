
import { TreePlantingLog, EarningsLog, Achievement } from '@/types/TreePlanting';

export const ACHIEVEMENT_DEFINITIONS = [
  {
    id: 'first_tree',
    title: 'First Seedling',
    description: 'Plant your first tree',
    icon: '🌱',
    target: 1,
    type: 'trees' as const,
  },
  {
    id: 'hundred_trees',
    title: 'Century Planter',
    description: 'Plant 100 trees',
    icon: '🌿',
    target: 100,
    type: 'trees' as const,
  },
  {
    id: 'thousand_trees',
    title: 'Forest Maker',
    description: 'Plant 1,000 trees',
    icon: '🌳',
    target: 1000,
    type: 'trees' as const,
  },
  {
    id: 'five_thousand_trees',
    title: 'Tree Legend',
    description: 'Plant 5,000 trees',
    icon: '🏆',
    target: 5000,
    type: 'trees' as const,
  },
  {
    id: 'ten_thousand_trees',
    title: 'Eco Warrior',
    description: 'Plant 10,000 trees',
    icon: '👑',
    target: 10000,
    type: 'trees' as const,
  },
  {
    id: 'first_day',
    title: 'Day One',
    description: 'Complete your first planting day',
    icon: '📅',
    target: 1,
    type: 'days' as const,
  },
  {
    id: 'week_streak',
    title: 'Week Warrior',
    description: 'Plant trees for 7 days',
    icon: '🔥',
    target: 7,
    type: 'days' as const,
  },
  {
    id: 'month_streak',
    title: 'Monthly Master',
    description: 'Plant trees for 30 days',
    icon: '⭐',
    target: 30,
    type: 'days' as const,
  },
  {
    id: 'first_earnings',
    title: 'First Paycheck',
    description: 'Earn your first dollar',
    icon: '💵',
    target: 1,
    type: 'earnings' as const,
  },
  {
    id: 'thousand_earnings',
    title: 'Money Maker',
    description: 'Earn $1,000',
    icon: '💰',
    target: 1000,
    type: 'earnings' as const,
  },
  {
    id: 'five_thousand_earnings',
    title: 'Big Earner',
    description: 'Earn $5,000',
    icon: '💎',
    target: 5000,
    type: 'earnings' as const,
  },
  {
    id: 'productive_day',
    title: 'Productive Day',
    description: 'Plant 2,000 trees in one day',
    icon: '🚀',
    target: 2000,
    type: 'single_day' as const,
  },
  {
    id: 'super_productive',
    title: 'Super Productive',
    description: 'Plant 3,000 trees in one day',
    icon: '⚡',
    target: 3000,
    type: 'single_day' as const,
  },
];

export function checkAchievements(
  treeLogs: TreePlantingLog[],
  earningsLogs: EarningsLog[],
  existingAchievements: Achievement[]
): Achievement[] {
  const totalTrees = treeLogs.reduce((sum, log) => sum + log.totalTrees, 0);
  const totalDays = treeLogs.length;
  const totalEarnings = earningsLogs.reduce((sum, log) => sum + log.amount, 0);
  const maxTreesInDay = treeLogs.length > 0 
    ? Math.max(...treeLogs.map(log => log.totalTrees))
    : 0;

  const achievements: Achievement[] = ACHIEVEMENT_DEFINITIONS.map(def => {
    let progress = 0;

    switch (def.type) {
      case 'trees':
        progress = totalTrees;
        break;
      case 'days':
        progress = totalDays;
        break;
      case 'earnings':
        progress = totalEarnings;
        break;
      case 'single_day':
        progress = maxTreesInDay;
        break;
    }

    const existing = existingAchievements.find(a => a.id === def.id);
    const isNewlyUnlocked = !existing?.unlockedAt && progress >= def.target;

    return {
      id: def.id,
      title: def.title,
      description: def.description,
      icon: def.icon,
      progress,
      target: def.target,
      unlockedAt: existing?.unlockedAt || (isNewlyUnlocked ? new Date().toISOString() : ''),
    };
  });

  return achievements;
}
