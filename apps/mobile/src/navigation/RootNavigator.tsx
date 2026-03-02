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
        options={{ tabBarLabel: '홈', tabBarIcon: ({ focused }) => <TabIcon label="🏠" focused={focused} /> }}
      />
      <MainTab.Screen
        name="Quest"
        component={QuestScreen}
        options={{ tabBarLabel: '퀘스트', tabBarIcon: ({ focused }) => <TabIcon label="✦" focused={focused} /> }}
      />
      <MainTab.Screen
        name="Meditation"
        component={MeditationScreen}
        options={{ tabBarLabel: '명상', tabBarIcon: ({ focused }) => <TabIcon label="🧘" focused={focused} /> }}
      />
      <MainTab.Screen
        name="Shop"
        component={ShopScreen}
        options={{ tabBarLabel: '상점', tabBarIcon: ({ focused }) => <TabIcon label="💎" focused={focused} /> }}
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
      apiClient.get('/character'),
      apiClient.get('/auth/me'),
    ]);
    const data = charRes.data;
    if (data) {
      useCharacterStore.getState().setCharacter({
        characterType: data.characterType || 'hana',
        level: data.level || 1,
        exp: data.exp || 0,
        bgTheme: data.bgTheme || 'starlight',
        equippedItems: data.equippedItems || {},
      });
    }
    if (userRes.data) {
      useCharacterStore.getState().setZenCoins(userRes.data.zenCoins ?? 0);
    }
  } catch (e) {
    useCharacterStore.getState().setCharacter({
      characterType: 'hana',
      level: 1,
      exp: 0,
      bgTheme: 'starlight',
      equippedItems: {},
    });
  }
}

export function RootNavigator() {
  const [showSplash, setShowSplash] = useState(true);
  const { isAuthenticated, setAuth } = useAuthStore();

  useEffect(() => {
    useCharacterStore.getState().setLang('ko');

    const autoLogin = async () => {
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

      try {
        const res = await fetch(`${API_BASE}/auth/guest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lang: 'ko' }),
        });
        if (res.ok) {
          const data = await res.json();
          setAuth(data.token, data.userId);
          await fetchAndSetCharacter();
        }
      } catch (e) {
        console.error('[Zenny] Auto login failed:', e);
      }
      setShowSplash(false);
    };

    autoLogin();
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  if (isAuthenticated) {
    return <AppNavigator />;
  }

  return <AuthNavigator />;
}
