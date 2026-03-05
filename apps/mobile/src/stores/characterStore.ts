import { create } from 'zustand';
import type { Character, Lang, ItemSlot } from '../types';
import { calcLevel } from '../utils/exp';
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
      const newLevel = calcLevel(newExp);
      return { character: { ...state.character, exp: newExp, level: newLevel } };
    }),
}));
