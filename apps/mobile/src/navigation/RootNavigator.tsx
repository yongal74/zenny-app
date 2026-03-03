import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, Platform } from 'react-native';
import { COLORS } from '../constants/colors';
import { useAuthStore } from '../stores/authStore';
import { useCharacterStore } from '../stores/characterStore';
import { apiClient, API_BASE } from '../utils/api';

import { HomeScreen } from '../screens/home/HomeScreen';
import { AICoachScreen } from '../screens/ai-coach/AICoachScreen';
import { ShopScreen } from '../screens/shop/ShopScreen';
import { QuestScreen } from '../screens/quest/QuestScreen';
import { MeditationScreen } from '../screens/meditation/MeditationScreen';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';

export type AuthStackParamList = {
  Login: undefined;
  Onboarding: undefined;
};
export type MainTabParamList = {
  Home: undefined;
  Quest: undefined;
  Meditation: undefined;
  Shop: undefined;
};
export type AppStackParamList = {
  MainTabs: undefined;
  AICoach: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

const TabIcon = ({ label, focused }: { label: string; focused: boolean }) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>{label}</Text>
);

function MainTabs() {
  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.bottomBar,
          borderTopColor: 'rgba(200,200,240,0.06)',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: COLORS.text3,
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: -2,
        },
      }}
    >
      <MainTab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home', tabBarIcon: ({ focused }) => <TabIcon label="🏠" focused={focused} /> }}
      />
      <MainTab.Screen
        name="Quest"
        component={QuestScreen}
        options={{ tabBarLabel: 'Quests', tabBarIcon: ({ focused }) => <TabIcon label="✦" focused={focused} /> }}
      />
      <MainTab.Screen
        name="Meditation"
        component={MeditationScreen}
        options={{ tabBarLabel: 'Meditation', tabBarIcon: ({ focused }) => <TabIcon label="🧘" focused={focused} /> }}
      />
      <MainTab.Screen
        name="Shop"
        component={ShopScreen}
        options={{ tabBarLabel: 'Shop', tabBarIcon: ({ focused }) => <TabIcon label="💎" focused={focused} /> }}
      />
    </MainTab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="MainTabs" component={MainTabs} />
      <AppStack.Screen
        name="AICoach"
        component={AICoachScreen}
        options={{ presentation: 'modal' }}
      />
    </AppStack.Navigator>
  );
}

async function fetchAndSetCharacter() {
  try {
    const [charRes, userRes] = await Promise.all([
      apiClient.get('/character', { timeout: 5000 }),
      apiClient.get('/auth/me', { timeout: 5000 }),
    ]);
    const data = charRes.data;
    if (data) {
      useCharacterStore.getState().setCharacter({
        userId: data.userId || '',
        characterType: data.characterType || 'hana',
        level: data.level || 1,
        exp: data.exp || 0,
        hunger: data.hunger ?? 100,
        mood: data.mood ?? 100,
        equippedSkin: data.equippedSkin || '',
        equippedItems: data.equippedItems || {},
        ownedItems: data.ownedItems || [],
        bgTheme: data.bgTheme || 'starlight',
        lastFedAt: data.lastFedAt || new Date().toISOString(),
      });
    }
    if (userRes.data) {
      useCharacterStore.getState().setZenCoins(userRes.data.zenCoins ?? 0);
    }
  } catch (e) {
    useCharacterStore.getState().setCharacter({
      userId: '',
      characterType: 'hana',
      level: 1,
      exp: 0,
      hunger: 100,
      mood: 100,
      equippedSkin: '',
      equippedItems: {},
      ownedItems: [],
      bgTheme: 'starlight',
      lastFedAt: new Date().toISOString(),
    });
  }
}

export function RootNavigator() {
  const [showSplash, setShowSplash] = useState(true);
  const { isAuthenticated, setAuth } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      // Web: OAuth redirect 처리
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const authToken = params.get('auth_token');
        const authUser = params.get('auth_user');
        if (authToken && authUser) {
          window.history.replaceState({}, '', '/');
          setAuth(authToken, authUser);
          await fetchAndSetCharacter();
          setShowSplash(false);
          return;
        }
      }

      // 자동 게스트 로그인 — 4초 타임아웃
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`${API_BASE}/auth/guest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lang: 'en' }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          setAuth(data.token, data.userId);
          await fetchAndSetCharacter();
        }
      } catch {
        // 타임아웃 or 연결 실패 → 로그인 화면으로
      }
      setShowSplash(false);
    };

    init();
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  if (isAuthenticated) {
    return <AppNavigator />;
  }

  return <AuthNavigator />;
}
