// Zenny Game Constants

export const COIN_REWARDS = {
  emotionCheckin: 15,
  dailyQuestComplete: 25,
  weeklyQuestComplete: 100,
  levelUp: 50,
} as const;

export const EXP_REWARDS = {
  emotionCheckin: 30,
  dailyQuestComplete: 50,
  weeklyQuestComplete: 200,
  characterFeed: 10,
} as const;

export const CHARACTER_EXP_THRESHOLDS = [
  0,    // Level 1
  100,  // Level 2
  250,  // Level 3
  450,  // Level 4
  700,  // Level 5
  1000, // Level 6
  1350, // Level 7
  1750, // Level 8
  2200, // Level 9
  2700, // Level 10
  3250, // Level 11
  3850, // Level 12
  4500, // Level 13
  5200, // Level 14
  6000, // Level 15
] as const;

export const CHARACTER_TYPES = [
  'hana',  // Cherry blossom spirit
  'sora',  // Sky dragon
  'tora',  // Tiger spirit
  'mizu',  // Water spirit
  'kaze',  // Wind spirit
] as const;

export const EMOTION_TYPES = [
  'happy',
  'calm',
  'anxious',
  'sad',
  'angry',
  'excited',
  'tired',
  'grateful',
] as const;

export const QUEST_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
} as const;

export const SHOP_ITEM_TYPES = {
  ACCESSORY: 'accessory',
  SKIN: 'skin',
  CHARACTER: 'character',
} as const;

export const SHOP_ITEM_SLOTS = {
  HAT: 'hat',
  FACE: 'face',
  BODY: 'body',
  SKIN: 'skin',
  BG: 'bg',
  PET: 'pet',
} as const;

export const RARITY_TYPES = {
  COMMON: 'common',
  RARE: 'rare',
  LEGENDARY: 'legendary',
} as const;

// Helper function to calculate level from EXP
export function calculateLevel(exp: number): number {
  for (let i = CHARACTER_EXP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (exp >= CHARACTER_EXP_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

// Helper function to check if level up occurred
export function checkLevelUp(oldExp: number, newExp: number): { isLevelUp: boolean; newLevel: number } {
  const oldLevel = calculateLevel(oldExp);
  const newLevel = calculateLevel(newExp);
  return {
    isLevelUp: newLevel > oldLevel,
    newLevel,
  };
}
