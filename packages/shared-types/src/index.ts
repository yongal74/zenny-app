// Zenny Shared Types
// Shared between frontend and backend

// ===== Language & Coach Types =====
export type Language = 'en' | 'ko';

export type Emotion = 'happy' | 'sad' | 'anxious' | 'angry' | 'calm' | 'stressed';

export interface QuickReply {
  id: string;
  label: string;
  emotion: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  quickReplies?: QuickReply[];
  timestamp: string;
  [key: string]: unknown;
}

// ===== Constants =====
export const COIN_REWARDS = {
  emotionCheckin: 15,
  meditationComplete: 20,
  dailyQuestComplete: 30,
  weeklyQuestComplete: 100,
  feedCharacter: 5,
  playWithCharacter: 10,
} as const;

export const EXP_REWARDS = {
  emotionCheckin: 30,
  meditationComplete: 50,
  dailyQuestComplete: 40,
  weeklyQuestComplete: 150,
  feedCharacter: 10,
  playWithCharacter: 15,
} as const;

export const CHARACTER_EXP_THRESHOLDS = [
  0,    // Level 1
  100,  // Level 2
  250,  // Level 3
  450,  // Level 4
  700,  // Level 5
  1000, // Level 6
  1400, // Level 7
] as const;

// ===== Types =====
export type CharacterType = 'hana' | 'sora' | 'tora' | 'mizu' | 'kaze';
export type EmotionType = 'happy' | 'sad' | 'anxious' | 'angry' | 'calm' | 'stressed';
export type QuestType = 'daily' | 'weekly';
export type MeditationType = 'breathing' | 'bodyscan' | 'guided' | 'nature';
export type ItemSlot = 'hat' | 'face' | 'body' | 'skin' | 'bg' | 'pet';
export type ItemRarity = 'common' | 'rare' | 'legendary';
export type AuthProvider = 'email' | 'apple' | 'google';

// ===== Request/Response Interfaces =====

// Auth
export interface LoginRequest {
  email: string;
  provider: AuthProvider;
}

export interface LoginResponse {
  userId: string;
  token: string;
  refreshToken: string;
}

// Dashboard
export interface DashboardResponse {
  character: {
    level: number;
    exp: number;
    hunger: number;
    mood: number;
    characterType: CharacterType;
    equippedSkin: string;
    bgTheme: string;
  };
  quests: QuestSummary[];
  coins: number;
  streak: number;
  todayCheckin: boolean;
}

// Emotion Checkin
export interface EmotionCheckinRequest {
  emotion: EmotionType;
  text?: string;
  intensity: number; // 1-5
}

export interface EmotionCheckinResponse {
  checkinId: string;
  expGained: number;
  coinsGained: number;
  streak: number;
}

// Character
export interface CharacterEquipRequest {
  itemId: string;
  slot: ItemSlot;
}

export interface CharacterEquipResponse {
  character: {
    equippedItems: Record<ItemSlot, string>;
    bgTheme: string;
  };
}

export interface CharacterFeedRequest {
  action: 'feed' | 'play';
}

export interface CharacterFeedResponse {
  character: {
    hunger: number;
    mood: number;
    exp: number;
  };
  expGained: number;
  coinsGained: number;
  message: string;
}

// Shop
export interface ShopPurchaseRequest {
  itemId: string;
}

export interface ShopPurchaseResponse {
  success: boolean;
  remainingCoins: number;
  item: {
    id: string;
    name: string;
    type: string;
  };
}

export interface ShopItemsResponse {
  items: ShopItem[];
  balance: number;
}

export interface ShopItem {
  id: string;
  name: string;
  type: string;
  slot: ItemSlot;
  category: string;
  price: number;
  rarity: ItemRarity;
  imageUrl: string;
  bgTheme?: string;
  levelRequired: number;
  owned?: boolean;
  equipped?: boolean;
}

// Quests
export interface QuestSummary {
  id: string;
  type: QuestType;
  title: string;
  description: string;
  coinsReward: number;
  expReward: number;
  completedAt?: string;
}

export interface QuestCompleteResponse {
  questId: string;
  coinsGained: number;
  expGained: number;
  isLevelUp: boolean;
  newLevel?: number;
}

// Coach Session
export interface CoachChatRequest {
  message: string;
  lang?: 'en' | 'ko';
  quickReplyChoice?: string;
  sessionId?: string;
}

export interface CoachChatResponse {
  response: string;
  quickReplies?: string[];
  suggestedAction?: 'meditation' | 'breathing' | 'journal';
  coinsGained: number;
  expGained: number;
  sessionId: string;
}

// Meditation
export interface MeditationTrack {
  id: string;
  title: string;
  type: MeditationType;
  emotion?: string;
  audioUrl: string;
  musicUrl?: string;
  duration: number;
  lang: string;
}

export interface MeditationTracksResponse {
  tracks: MeditationTrack[];
}

export interface MeditationCompleteRequest {
  trackId: string;
}

export interface MeditationCompleteResponse {
  coinsGained: number;
  expGained: number;
  questUpdated: boolean;
}

// ===== Utility Functions =====

export function calculateLevel(exp: number): number {
  for (let i = CHARACTER_EXP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (exp >= CHARACTER_EXP_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

export function getExpForNextLevel(currentLevel: number): number {
  if (currentLevel >= CHARACTER_EXP_THRESHOLDS.length) {
    return CHARACTER_EXP_THRESHOLDS[CHARACTER_EXP_THRESHOLDS.length - 1];
  }
  return CHARACTER_EXP_THRESHOLDS[currentLevel];
}
