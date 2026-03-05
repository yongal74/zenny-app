import { create } from 'zustand';
import type { ChatMessage, ChatSession, QuickReply } from '../types';

interface ChatStore {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  turnCount: number;
  startSession: () => void;
  addMessage: (msg: ChatMessage) => void;
  clearSession: () => void;
}

const createSession = (): ChatSession => ({
  sessionId: Date.now().toString(),
  messages: [
    // 첫 인사 메시지 (AI)
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi there 🌟 How are you feeling right now?",
      timestamp: new Date().toISOString(),
      quickReplies: [
        { id: 'qr-happy', label: '😊 Happy', emotion: 'happy' },
        { id: 'qr-anxious', label: '😰 Anxious', emotion: 'anxious' },
        { id: 'qr-tired', label: '😴 Tired', emotion: 'tired' },
        { id: 'qr-stressed', label: '😤 Stressed', emotion: 'stressed' },
        { id: 'qr-sad', label: '😢 Sad', emotion: 'sad' },
        { id: 'qr-confused', label: '🤷 Not sure', emotion: 'confused' },
      ] as QuickReply[],
    },
  ],
});

export const useChatStore = create<ChatStore>((set, get) => ({
  currentSession: null,
  sessions: [],
  turnCount: 0,

  startSession: () => {
    const session = createSession();
    set({ currentSession: session, turnCount: 0 });
  },

  addMessage: (msg) =>
    set((state) => {
      if (!state.currentSession) return state;
      const updated: ChatSession = {
        ...state.currentSession,
        messages: [...state.currentSession.messages, msg],
      };
      return {
        currentSession: updated,
        turnCount: msg.role === 'user' ? state.turnCount + 1 : state.turnCount,
      };
    }),

  clearSession: () => {
    const prev = get().currentSession;
    if (prev) {
      set((state) => ({
        sessions: [prev, ...state.sessions].slice(0, 20), // 최근 20개만 보관
        currentSession: null,
        turnCount: 0,
      }));
    }
  },
}));
