import React, { useCallback } from 'react';
import { View, StatusBar, Platform, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  DMSans_400Regular,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { Fraunces_500Medium } from '@expo-google-fonts/fraunces';
import { registerRootComponent } from 'expo';
import { RootNavigator } from './src/navigation/RootNavigator';
import { COLORS } from './src/constants/colors';

let SplashScreenModule: any = null;
if (Platform.OS !== 'web') {
  SplashScreenModule = require('expo-splash-screen');
  SplashScreenModule.preventAutoHideAsync();
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 2 },
  },
});

function App() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_600SemiBold,
    DMSans_700Bold,
    Fraunces_500Medium,
  });

  const onLayoutRootView = useCallback(async () => {
    if ((fontsLoaded || fontError) && SplashScreenModule) {
      await SplashScreenModule.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: COLORS.text, fontSize: 18 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <View
          style={{ flex: 1, backgroundColor: COLORS.bg }}
          onLayout={onLayoutRootView}
        >
          <RootNavigator />
        </View>
      </NavigationContainer>
    </QueryClientProvider>
  );
}

registerRootComponent(App);
