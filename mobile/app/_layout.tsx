import { useEffect } from 'react';
import { Stack, router, usePathname } from 'expo-router';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { queryClient } from '../src/lib/queryClient';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { ActivityIndicator, View, Text, TextInput } from 'react-native';
import { COLORS, FONTS } from '../src/constants';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { useFonts } from 'expo-font';
import {
  NotoSansMyanmar_400Regular,
  NotoSansMyanmar_500Medium,
  NotoSansMyanmar_600SemiBold,
  NotoSansMyanmar_700Bold,
} from '@expo-google-fonts/noto-sans-myanmar';

SplashScreen.preventAutoHideAsync();

async function applyAvailableUpdate() {
  if (!Updates.isEnabled || __DEV__) {
    return;
  }

  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } catch (error) {
    console.warn('OTA update check failed:', error);
  }
}

// ─── Global font override ────────────────────────────────────────────────────
// Apply NotoSansMyanmar to every <Text> and <TextInput> so Myanmar glyphs
// render correctly on all platforms without touching individual stylesheets.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Text as any).defaultProps = (Text as any).defaultProps ?? {};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Text as any).defaultProps.style = { fontFamily: FONTS.regular };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(TextInput as any).defaultProps = (TextInput as any).defaultProps ?? {};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(TextInput as any).defaultProps.style = { fontFamily: FONTS.regular };
// ────────────────────────────────────────────────────────────────────────────

// Refresh every active query whenever the visible screen changes (e.g. going
// back to a list after creating, editing or deleting something). This keeps
// mounted screens in sync without remounting them or reloading the app.
function RouteFocusRefetch() {
  const pathname = usePathname();
  const queryClient = useQueryClient();

  useEffect(() => {
    void queryClient.invalidateQueries();
  }, [pathname, queryClient]);

  return null;
}

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color={COLORS.white} />
      </View>
    );
  }

  return (
    <>
      <RouteFocusRefetch />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="parcels/[id]"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="parcels/create"
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="parcels/edit/[id]"
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="deliveries/[id]"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="deliveries/attempt/[id]"
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="users/[id]"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="users/create"
          options={{ headerShown: false, presentation: 'modal' }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    NotoSansMyanmar_400Regular,
    NotoSansMyanmar_500Medium,
    NotoSansMyanmar_600SemiBold,
    NotoSansMyanmar_700Bold,
  });

  useEffect(() => {
    applyAvailableUpdate();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color={COLORS.white} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <StatusBar style="light" />
              <RootLayoutNav />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
