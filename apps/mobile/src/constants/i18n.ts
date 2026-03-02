import { Language } from '../types';

export type TranslationKey =
  | 'greeting'
  | 'howAreYou'
  | 'typeMessage'
  | 'dailyQuests'
  | 'customize'
  | 'home'
  | 'quest'
  | 'shop'
  | 'zenAI'
  | 'level'
  | 'exp';

export const translations: Record<TranslationKey, Record<Language, string>> = {
  greeting: { en: 'Good morning', ko: '좋은 아침이에요' },
  howAreYou: { en: 'How are you feeling today?', ko: '오늘 기분이 어떠세요?' },
  typeMessage: { en: 'Type a message...', ko: '메시지를 입력하세요...' },
  dailyQuests: { en: 'Daily Quests', ko: '오늘의 퀘스트' },
  customize: { en: 'Customize', ko: '커스터마이즈' },
  home: { en: 'Home', ko: '홈' },
  quest: { en: 'Quest', ko: '퀘스트' },
  shop: { en: 'Shop', ko: '상점' },
  zenAI: { en: 'Zen AI', ko: 'Zen AI' },
  level: { en: 'Lv', ko: '레벨' },
  exp: { en: 'EXP', ko: '경험치' },
};

export const t = (key: TranslationKey, lang: Language): string => {
  return translations[key][lang];
};
