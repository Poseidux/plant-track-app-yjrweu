
import { TreePlantingLog, EarningsLog, Achievement } from '@/types/TreePlanting';

export const ACHIEVEMENT_DEFINITIONS = [
  // First milestones
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
    id: 'five_hundred_trees',
    title: 'Growing Forest',
    description: 'Plant 500 trees',
    icon: '🌲',
    target: 500,
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
    id: 'two_thousand_trees',
    title: 'Tree Champion',
    description: 'Plant 2,000 trees',
    icon: '🏅',
    target: 2000,
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
    id: 'twenty_thousand_trees',
    title: 'Forest Guardian',
    description: 'Plant 20,000 trees',
    icon: '🦸',
    target: 20000,
    type: 'trees' as const,
  },
  {
    id: 'fifty_thousand_trees',
    title: 'Nature Hero',
    description: 'Plant 50,000 trees',
    icon: '⭐',
    target: 50000,
    type: 'trees' as const,
  },
  
  // Working day streaks
  {
    id: 'first_day',
    title: 'Day One',
    description: 'Complete your first planting day',
    icon: '📅',
    target: 1,
    type: 'days' as const,
  },
  {
    id: 'three_day_streak',
    title: '3-Day Streak',
    description: 'Plant trees for 3 consecutive days',
    icon: '🔥',
    target: 3,
    type: 'streak' as const,
  },
  {
    id: 'week_streak',
    title: 'Week Warrior',
    description: 'Plant trees for 7 consecutive days',
    icon: '💪',
    target: 7,
    type: 'streak' as const,
  },
  {
    id: 'two_week_streak',
    title: 'Fortnight Fighter',
    description: 'Plant trees for 14 consecutive days',
    icon: '🌟',
    target: 14,
    type: 'streak' as const,
  },
  {
    id: 'month_streak',
    title: 'Monthly Master',
    description: 'Plant trees for 30 consecutive days',
    icon: '🎖️',
    target: 30,
    type: 'streak' as const,
  },
  {
    id: 'ten_days_total',
    title: 'Dedicated Planter',
    description: 'Complete 10 planting days',
    icon: '📆',
    target: 10,
    type: 'days' as const,
  },
  {
    id: 'twenty_days_total',
    title: 'Seasoned Planter',
    description: 'Complete 20 planting days',
    icon: '🗓️',
    target: 20,
    type: 'days' as const,
  },
  {
    id: 'fifty_days_total',
    title: 'Veteran Planter',
    description: 'Complete 50 planting days',
    icon: '🎯',
    target: 50,
    type: 'days' as const,
  },
  {
    id: 'hundred_days_total',
    title: 'Century of Days',
    description: 'Complete 100 planting days',
    icon: '💯',
    target: 100,
    type: 'days' as const,
  },
  
  // Earnings achievements
  {
    id: 'first_earnings',
    title: 'First Paycheck',
    description: 'Earn your first dollar',
    icon: '💵',
    target: 1,
    type: 'earnings' as const,
  },
  {
    id: 'five_hundred_earnings',
    title: 'Getting Started',
    description: 'Earn $500',
    icon: '💸',
    target: 500,
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
    id: 'ten_thousand_earnings',
    title: 'Wealth Builder',
    description: 'Earn $10,000',
    icon: '🤑',
    target: 10000,
    type: 'earnings' as const,
  },
  
  // Single day achievements
  {
    id: 'productive_day_500',
    title: 'Good Start',
    description: 'Plant 500 trees in one day',
    icon: '🌱',
    target: 500,
    type: 'single_day' as const,
  },
  {
    id: 'productive_day_1000',
    title: 'Solid Day',
    description: 'Plant 1,000 trees in one day',
    icon: '🌿',
    target: 1000,
    type: 'single_day' as const,
  },
  {
    id: 'productive_day_1500',
    title: 'Strong Performance',
    description: 'Plant 1,500 trees in one day',
    icon: '🌲',
    target: 1500,
    type: 'single_day' as const,
  },
  {
    id: 'productive_day_2000',
    title: 'Productive Day',
    description: 'Plant 2,000 trees in one day',
    icon: '🚀',
    target: 2000,
    type: 'single_day' as const,
  },
  {
    id: 'productive_day_2500',
    title: 'Impressive Work',
    description: 'Plant 2,500 trees in one day',
    icon: '💪',
    target: 2500,
    type: 'single_day' as const,
  },
  {
    id: 'super_productive_3000',
    title: 'Super Productive',
    description: 'Plant 3,000 trees in one day',
    icon: '⚡',
    target: 3000,
    type: 'single_day' as const,
  },
  {
    id: 'elite_day_4000',
    title: 'Elite Planter',
    description: 'Plant 4,000 trees in one day',
    icon: '🔥',
    target: 4000,
    type: 'single_day' as const,
  },
  {
    id: 'legendary_day_5000',
    title: 'Legendary Day',
    description: 'Plant 5,000 trees in one day',
    icon: '🏆',
    target: 5000,
    type: 'single_day' as const,
  },
  {
    id: 'beast_mode_6000',
    title: 'Beast Mode',
    description: 'Plant 6,000 trees in one day',
    icon: '🦁',
    target: 6000,
    type: 'single_day' as const,
  },
  {
    id: 'superhuman_7000',
    title: 'Superhuman',
    description: 'Plant 7,000 trees in one day',
    icon: '🦸‍♂️',
    target: 7000,
    type: 'single_day' as const,
  },
  {
    id: 'unstoppable_8000',
    title: 'Unstoppable',
    description: 'Plant 8,000 trees in one day',
    icon: '💥',
    target: 8000,
    type: 'single_day' as const,
  },
  {
    id: 'phenomenal_9000',
    title: 'Phenomenal',
    description: 'Plant 9,000 trees in one day',
    icon: '✨',
    target: 9000,
    type: 'single_day' as const,
  },
  {
    id: 'godlike_10000',
    title: 'Godlike',
    description: 'Plant 10,000 trees in one day',
    icon: '👑',
    target: 10000,
    type: 'single_day' as const,
  },
  {
    id: 'mythical_11000',
    title: 'Mythical',
    description: 'Plant 11,000 trees in one day',
    icon: '🌟',
    target: 11000,
    type: 'single_day' as const,
  },
  {
    id: 'transcendent_12000',
    title: 'Transcendent',
    description: 'Plant 12,000 trees in one day',
    icon: '🌌',
    target: 12000,
    type: 'single_day' as const,
  },
];

function calculateStreak(treeLogs: TreePlantingLog[]): number {
  if (treeLogs.length === 0) return 0;

  const sortedLogs = [...treeLogs].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let streak = 1;
  let currentDate = new Date(sortedLogs[0].date);

  for (let i = 1; i < sortedLogs.length; i++) {
    const logDate = new Date(sortedLogs[i].date);
    const dayDiff = Math.floor((currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDiff === 1) {
      streak++;
      currentDate = logDate;
    } else if (dayDiff > 1) {
      break;
    }
  }

  return streak;
}

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
  const currentStreak = calculateStreak(treeLogs);

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
      case 'streak':
        progress = currentStreak;
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
