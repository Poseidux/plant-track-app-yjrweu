
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'theme' | 'avatar-frame' | 'icon' | 'emoji' | 'badge';
  icon?: string;
  themeId?: string;
  frameStyle?: string;
  iconEmoji?: string;
  badgeStyle?: 'animated' | 'shiny';
  isPurchased?: boolean;
}

export interface UserCosmetics {
  coins: number;
  purchasedItems: string[];
  equippedAvatarFrame?: string;
  equippedIcon?: string;
  equippedEmoji?: string;
}

export const AVATAR_FRAMES = [
  { id: 'frame-gold', name: 'Gold Frame', emoji: '🟡', price: 500 },
  { id: 'frame-silver', name: 'Silver Frame', emoji: '⚪', price: 300 },
  { id: 'frame-bronze', name: 'Bronze Frame', emoji: '🟤', price: 200 },
  { id: 'frame-diamond', name: 'Diamond Frame', emoji: '💎', price: 1000 },
  { id: 'frame-emerald', name: 'Emerald Frame', emoji: '💚', price: 800 },
  { id: 'frame-ruby', name: 'Ruby Frame', emoji: '❤️', price: 800 },
  { id: 'frame-sapphire', name: 'Sapphire Frame', emoji: '💙', price: 800 },
  { id: 'frame-rainbow', name: 'Rainbow Frame', emoji: '🌈', price: 1500 },
];

export const PROFILE_ICONS = [
  { id: 'icon-tree', name: 'Tree Icon', emoji: '🌲', price: 100 },
  { id: 'icon-leaf', name: 'Leaf Icon', emoji: '🍃', price: 100 },
  { id: 'icon-seedling', name: 'Seedling Icon', emoji: '🌱', price: 100 },
  { id: 'icon-evergreen', name: 'Evergreen Icon', emoji: '🌲', price: 100 },
  { id: 'icon-deciduous', name: 'Deciduous Icon', emoji: '🌳', price: 100 },
  { id: 'icon-palm', name: 'Palm Icon', emoji: '🌴', price: 150 },
  { id: 'icon-cactus', name: 'Cactus Icon', emoji: '🌵', price: 150 },
  { id: 'icon-flower', name: 'Flower Icon', emoji: '🌸', price: 150 },
  { id: 'icon-sunflower', name: 'Sunflower Icon', emoji: '🌻', price: 150 },
  { id: 'icon-rose', name: 'Rose Icon', emoji: '🌹', price: 200 },
  { id: 'icon-tulip', name: 'Tulip Icon', emoji: '🌷', price: 200 },
  { id: 'icon-blossom', name: 'Blossom Icon', emoji: '🌺', price: 200 },
];

export const PROFILE_EMOJIS = [
  { id: 'emoji-smile', name: 'Smile', emoji: '😊', price: 50 },
  { id: 'emoji-cool', name: 'Cool', emoji: '😎', price: 50 },
  { id: 'emoji-star', name: 'Star Eyes', emoji: '🤩', price: 100 },
  { id: 'emoji-love', name: 'Love', emoji: '😍', price: 100 },
  { id: 'emoji-party', name: 'Party', emoji: '🥳', price: 150 },
  { id: 'emoji-fire', name: 'Fire', emoji: '🔥', price: 150 },
  { id: 'emoji-rocket', name: 'Rocket', emoji: '🚀', price: 200 },
  { id: 'emoji-trophy', name: 'Trophy', emoji: '🏆', price: 200 },
  { id: 'emoji-crown', name: 'Crown', emoji: '👑', price: 250 },
  { id: 'emoji-gem', name: 'Gem', emoji: '💎', price: 300 },
];
