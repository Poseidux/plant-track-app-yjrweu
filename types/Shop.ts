
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'theme' | 'avatar-frame' | 'avatar' | 'badge';
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
  equippedAvatar?: string;
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

export const PROFILE_ICONS_EMOJIS = [
  { id: 'avatar-tree', name: 'Tree', emoji: '🌲', price: 100 },
  { id: 'avatar-leaf', name: 'Leaf', emoji: '🍃', price: 100 },
  { id: 'avatar-seedling', name: 'Seedling', emoji: '🌱', price: 100 },
  { id: 'avatar-evergreen', name: 'Evergreen', emoji: '🌲', price: 100 },
  { id: 'avatar-deciduous', name: 'Deciduous', emoji: '🌳', price: 100 },
  { id: 'avatar-palm', name: 'Palm', emoji: '🌴', price: 150 },
  { id: 'avatar-cactus', name: 'Cactus', emoji: '🌵', price: 150 },
  { id: 'avatar-flower', name: 'Flower', emoji: '🌸', price: 150 },
  { id: 'avatar-sunflower', name: 'Sunflower', emoji: '🌻', price: 150 },
  { id: 'avatar-rose', name: 'Rose', emoji: '🌹', price: 200 },
  { id: 'avatar-tulip', name: 'Tulip', emoji: '🌷', price: 200 },
  { id: 'avatar-blossom', name: 'Blossom', emoji: '🌺', price: 200 },
  { id: 'avatar-smile', name: 'Smile', emoji: '😊', price: 50 },
  { id: 'avatar-cool', name: 'Cool', emoji: '😎', price: 50 },
  { id: 'avatar-star', name: 'Star Eyes', emoji: '🤩', price: 100 },
  { id: 'avatar-love', name: 'Love', emoji: '😍', price: 100 },
  { id: 'avatar-party', name: 'Party', emoji: '🥳', price: 150 },
  { id: 'avatar-fire', name: 'Fire', emoji: '🔥', price: 150 },
  { id: 'avatar-rocket', name: 'Rocket', emoji: '🚀', price: 200 },
  { id: 'avatar-trophy', name: 'Trophy', emoji: '🏆', price: 200 },
  { id: 'avatar-crown', name: 'Crown', emoji: '👑', price: 250 },
  { id: 'avatar-gem', name: 'Gem', emoji: '💎', price: 300 },
];
