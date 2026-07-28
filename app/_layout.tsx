import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { FontMap } from '@/constants/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts(FontMap);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="scene/[id]" />
        <Stack.Screen name="artisan" />
        <Stack.Screen name="designer" />
        <Stack.Screen name="brief" />
        <Stack.Screen name="brief-artisan" />
        <Stack.Screen name="brief-designer" />
        <Stack.Screen name="panier" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="tracking/[id]" />
        <Stack.Screen name="auth" />
      </Stack>
    </SafeAreaProvider>
  );
}
