
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
  { id: 'frame-gold', name: 'Gold Frame', emoji: '🟡', borderColor: '#FFD700', borderWidth: 4, price: 500 },
  { id: 'frame-silver', name: 'Silver Frame', emoji: '⚪', borderColor: '#C0C0C0', borderWidth: 4, price: 300 },
  { id: 'frame-bronze', name: 'Bronze Frame', emoji: '🟤', borderColor: '#CD7F32', borderWidth: 4, price: 200 },
  { id: 'frame-diamond', name: 'Diamond Frame', emoji: '💎', borderColor: '#B9F2FF', borderWidth: 5, price: 1000 },
  { id: 'frame-emerald', name: 'Emerald Frame', emoji: '💚', borderColor: '#50C878', borderWidth: 4, price: 800 },
  { id: 'frame-ruby', name: 'Ruby Frame', emoji: '❤️', borderColor: '#E0115F', borderWidth: 4, price: 800 },
  { id: 'frame-sapphire', name: 'Sapphire Frame', emoji: '💙', borderColor: '#0F52BA', borderWidth: 4, price: 800 },
  { id: 'frame-rainbow', name: 'Rainbow Frame', emoji: '🌈', borderColor: 'linear-gradient(45deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #9400D3)', borderWidth: 5, price: 1500 },
  { id: 'frame-fire', name: 'Fire Frame', emoji: '🔥', borderColor: '#FF4500', borderWidth: 4, price: 600 },
  { id: 'frame-ice', name: 'Ice Frame', emoji: '❄️', borderColor: '#00FFFF', borderWidth: 4, price: 600 },
  { id: 'frame-nature', name: 'Nature Frame', emoji: '🌿', borderColor: '#228B22', borderWidth: 4, price: 600 },
  { id: 'frame-cosmic', name: 'Cosmic Frame', emoji: '✨', borderColor: '#9370DB', borderWidth: 5, price: 900 },
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
  { id: 'avatar-alien', name: 'Alien', emoji: '👽', price: 200 },
  { id: 'avatar-robot', name: 'Robot', emoji: '🤖', price: 200 },
  { id: 'avatar-ghost', name: 'Ghost', emoji: '👻', price: 150 },
  { id: 'avatar-pumpkin', name: 'Pumpkin', emoji: '🎃', price: 150 },
  { id: 'avatar-santa', name: 'Santa', emoji: '🎅', price: 200 },
  { id: 'avatar-snowman', name: 'Snowman', emoji: '⛄', price: 150 },
  { id: 'avatar-unicorn', name: 'Unicorn', emoji: '🦄', price: 300 },
  { id: 'avatar-dragon', name: 'Dragon', emoji: '🐉', price: 300 },
  { id: 'avatar-phoenix', name: 'Phoenix', emoji: '🔥🦅', price: 350 },
  { id: 'avatar-butterfly', name: 'Butterfly', emoji: '🦋', price: 150 },
  { id: 'avatar-bee', name: 'Bee', emoji: '🐝', price: 150 },
  { id: 'avatar-ladybug', name: 'Ladybug', emoji: '🐞', price: 150 },
  { id: 'avatar-earth', name: 'Earth', emoji: '🌍', price: 250 },
  { id: 'avatar-moon', name: 'Moon', emoji: '🌙', price: 200 },
  { id: 'avatar-sun', name: 'Sun', emoji: '☀️', price: 200 },
  { id: 'avatar-lightning', name: 'Lightning', emoji: '⚡', price: 200 },
  { id: 'avatar-rainbow', name: 'Rainbow', emoji: '🌈', price: 250 },
  { id: 'avatar-cloud', name: 'Cloud', emoji: '☁️', price: 100 },
];
