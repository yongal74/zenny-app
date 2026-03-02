# Zone 1: Frontend — Claude Code 지시서
# Zenny React Native (Expo) 앱 구현

## 실행 방법
```bash
cd /path/to/Zenny
claude --directive DevArtifacts/claude-directives/zone1-frontend.md
```

---

## 컨텍스트
- 앱: Zenny (Tamagotchi × Zen 명상)
- 스택: React Native + Expo SDK 51 + TypeScript (strict)
- 색상: `src/constants/colors.ts` 참조 (Starlight 딥 네이비 테마)
- 타입: `src/types/index.ts` 참조

---

## Task 1 — 프로젝트 초기화

```bash
cd apps/mobile
npx create-expo-app@latest . --template blank-typescript
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install react-query zustand axios
npm install expo-notifications expo-av expo-haptics
npm install @expo-google-fonts/dm-sans @expo-google-fonts/fraunces expo-font
npm install i18next react-i18next
npm install -D @types/react-native
```

---

## Task 2 — 앱 진입점 (App.tsx)

파일: `apps/mobile/App.tsx`

```typescript
import React, { useCallback } from 'react';
import { View, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from 'react-query';
import * as Font from 'expo-font';
import { useFonts, DMSans_400Regular, DMSans_600SemiBold, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { Fraunces_500Medium } from '@expo-google-fonts/fraunces';
import * as SplashScreen from 'expo-splash-screen';
import { RootNavigator } from './src/navigation/RootNavigator';
import { COLORS } from './src/constants/colors';

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5 } },
});

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular, DMSans_600SemiBold, DMSans_700Bold, Fraunces_500Medium,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <View style={{ flex: 1, backgroundColor: COLORS.bg }} onLayout={onLayoutRootView}>
          <RootNavigator />
        </View>
      </NavigationContainer>
    </QueryClientProvider>
  );
}
```

---

## Task 3 — 네비게이션 구조

파일: `apps/mobile/src/navigation/RootNavigator.tsx`

구조:
```
RootNavigator (Stack)
  ├── AuthStack
  │   ├── SplashScreen
  │   ├── LoginScreen
  │   └── OnboardingScreen (캐릭터 선택)
  └── MainTabs (Bottom Tab)
      ├── HomeScreen
      ├── QuestScreen
      ├── ShopScreen
      └── AICoachScreen (Conversational UI)
```

탭바 아이콘 (텍스트 기반):
- Home: 🏠  Quest: ✦  Shop: 💎  Zen AI: ✿

탭바 스타일:
```typescript
tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border, height: 64 }
tabBarActiveTintColor: COLORS.accent // #EC4899
tabBarInactiveTintColor: COLORS.text3
```

---

## Task 4 — AI Coach Screen (핵심 화면)

파일: `apps/mobile/src/screens/ai-coach/AICoachScreen.tsx`

레이아웃 (세로 스택):
```
┌─────────────────────────────┐
│  EN | KO 토글  [✦ Customize]│  ← 상단 헤더
├─────────────────────────────┤
│                             │
│   ⬤  ⬤  ⬤   (글로우링)     │  ← 캐릭터 40%
│      [✿ Hana]              │
│    [Lv.3 Zen Apprentice]   │
│                             │
├─────────────────────────────┤
│  AI 메시지 (좌측 박스형)      │  ← 채팅 60%
│       사용자 메시지 (우측)    │
│  [😊Happy] [😤Stressed]    │
│  [😰Anxious][😢Sad]        │
│  [😴Tired] [🤷Not sure]    │
├─────────────────────────────┤
│ [Type a message...]    [↑] │  ← 입력창
└─────────────────────────────┘
```

`ConversationalUI` 컴포넌트: `src/components/chat/ConversationalUI.tsx` 이미 존재 — 그대로 import

캐릭터 표시 컴포넌트 (`CharacterDisplay.tsx`):
- Outer ring: 120×120 ellipse, fill `COLORS.charGlow1`
- Mid ring: 90×90 ellipse, fill `COLORS.charGlow2`  
- Inner ring: 64×64 ellipse, fill `COLORS.charGlow3`
- 이모지 텍스트 (캐릭터별): hana=✿ sora=☁ tora=🦊
- Lv 배지: `COLORS.accent` 20% opacity 배경

언어 토글 (`LanguageToggle.tsx`):
```typescript
// EN | KO 스위처
// 선택된 언어: COLORS.text (흰색), 비선택: COLORS.text3 (흐린)
```

---

## Task 5 — Home Screen

파일: `apps/mobile/src/screens/home/HomeScreen.tsx`

컴포넌트 구조:
```
ScrollView
  ├── Header: "Good morning, {name}" + 날짜
  ├── CharacterCard: 캐릭터 + Lv 배지 + EXP 바 + 명언
  ├── MoodCheckin: "오늘 기분?" 탭 → AICoachScreen으로 이동
  └── DailyQuests: 퀘스트 리스트 (QuestCard 컴포넌트)
```

---

## Task 6 — Zustand 스토어

파일: `apps/mobile/src/stores/characterStore.ts`
```typescript
interface CharacterStore {
  character: Character | null;
  lang: Language;
  setCharacter: (c: Character) => void;
  setLang: (l: Language) => void;
  equipItem: (slot: ItemSlot, itemId: string) => void;
}
```

파일: `apps/mobile/src/stores/chatStore.ts`
```typescript
interface ChatStore {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  addMessage: (msg: ChatMessage) => void;
  clearSession: () => void;
  turnCount: number;
}
```

---

## Task 7 — i18n 설정

파일: `apps/mobile/src/constants/i18n.ts`

EN/KO 키:
```typescript
{
  greeting: { en: 'Good morning', ko: '좋은 아침이에요' },
  howAreYou: { en: 'How are you feeling today?', ko: '오늘 기분이 어떠세요?' },
  typeMessage: { en: 'Type a message...', ko: '메시지를 입력하세요...' },
  dailyQuests: { en: 'Daily Quests', ko: '오늘의 퀘스트' },
}
```

---

## 완료 기준
- [ ] `npm run ios` 오류 없이 시뮬레이터 실행
- [ ] 탭 네비게이션 4개 탭 이동 동작
- [ ] AICoachScreen: 캐릭터 표시 + 메시지 박스 + 버튼 그리드 렌더링
- [ ] EN/KO 언어 토글 전환 동작
- [ ] HomeScreen: 캐릭터 카드 + 퀘스트 표시
