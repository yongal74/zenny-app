// ─── 공통 타입 정의 ───────────────────────────────────────────

export type CharacterType = 'hana' | 'sora' | 'tora' | 'mizu' | 'kaze';

export type ItemSlot = 'hat' | 'face' | 'body' | 'bg' | 'pet' | 'skin';

export type ItemType = 'skin' | 'accessory';

export type Rarity = 'common' | 'rare' | 'legendary';

export type Lang = 'en' | 'ko';

export interface Character {
    userId: string;
    characterType: CharacterType;
    level: number;
    exp: number;
    hunger: number;
    mood: number;
    equippedSkin: string;
    equippedItems: Partial<Record<ItemSlot, string | null>>;
    ownedItems: string[];
    bgTheme: string;
    lastFedAt: string;
}

export interface QuickReply {
    id: string;
    label: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    quickReplies?: QuickReply[];
    timestamp: string | number;
}

export interface MeditationTrack {
    id: string;
    title: string;
    titleKo?: string;
    type: 'breathing' | 'bodyscan' | 'guided' | 'nature';
    emotion?: string;
    lang: string;
    duration: number;
    audioUrl: string;
    musicUrl?: string;
    weekCreated: string;
}

export interface ShopItem {
    id: string;
    name: string;
    type: ItemType;
    slot: ItemSlot;
    category: string;
    price: number;
    rarity: Rarity;
    imageUrl: string;
    levelRequired: number;
    bgTheme?: string;
    owned?: boolean;
    equipped?: boolean;
    canBuy?: boolean;
}

export interface Quest {
    id: string;
    questId: string;
    title: string;
    titleKo: string;
    description: string;
    coinsReward: number;
    expReward: number;
    progress: number;
    target: number;
    completedAt: string | null;
}
