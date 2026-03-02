import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const [isReady, setIsReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    AsyncStorage.getItem("onboarding_completed").then((val) => {
      setNeedsOnboarding(val !== "true");
      setIsReady(true);
      SplashScreen.hideAsync();
    });
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const inOnboarding = segments[0] === "onboarding";
    if (needsOnboarding && !inOnboarding) {
      AsyncStorage.getItem("onboarding_completed").then((val) => {
        if (val === "true") {
          setNeedsOnboarding(false);
        } else {
          router.replace("/onboarding");
        }
      });
    }
  }, [isReady, needsOnboarding, segments]);

  if (!isReady) return null;

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="shop" options={{ headerShown: false }} />
      <Stack.Screen name="wellness" options={{ headerShown: false }} />
      <Stack.Screen name="meditation" options={{ headerShown: false }} />
      <Stack.Screen name="breathing" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView>
          <KeyboardProvider>
            <RootLayoutNav />
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
