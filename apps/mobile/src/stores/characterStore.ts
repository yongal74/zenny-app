import { create } from 'zustand';
import type { Character, Lang, ItemSlot } from '../types';
type Language = Lang;

interface CharacterStore {
  character: Character | null;
  lang: Language;
  zenCoins: number;
  setCharacter: (c: Character) => void;
  setLang: (l: Language) => void;
  setZenCoins: (coins: number) => void;
  equipItem: (slot: ItemSlot, itemId: string) => void;
  updateExp: (amount: number) => void;
}

export const useCharacterStore = create<CharacterStore>((set) => ({
  character: null,
  lang: 'en',
  zenCoins: 0,

  setCharacter: (character) => set({ character }),
  setLang: (lang) => set({ lang }),
  setZenCoins: (zenCoins) => set({ zenCoins }),

  equipItem: (slot, itemId) =>
    set((state) => {
      if (!state.character) return state;
      return {
        character: {
          ...state.character,
          equippedItems: { ...state.character.equippedItems, [slot]: itemId },
        },
      };
    }),

  updateExp: (amount) =>
    set((state) => {
      if (!state.character) return state;
      const newExp = state.character.exp + amount;
      // 레벨업 체크
      const EXP_THRESHOLDS: Record<number, number> = {
        1: 0, 2: 100, 3: 250, 4: 500, 5: 800, 6: 1200, 7: 2000,
      };
      let newLevel = state.character.level;
      for (let lv = 7; lv >= 1; lv--) {
        if (newExp >= EXP_THRESHOLDS[lv]) { newLevel = lv; break; }
      }
      return { character: { ...state.character, exp: newExp, level: newLevel } };
    }),
}));
