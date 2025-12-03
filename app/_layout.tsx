import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { initializeNetworkListener } from '@/services/network.service';
import { NetworkIndicator } from '@/components/NetworkIndicator';

export const unstable_settings = {
  initialRouteName: 'login',
};

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();

 
  useEffect(() => {
    const unsubscribe = initializeNetworkListener();
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(tabs)';

    if (!user && inAuthGroup) {
      
      router.replace('/login');
    } else if (user && !inAuthGroup) {
      // Usuário autenticado na tela de login
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  return (
    <>
      <NetworkIndicator />
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: 'modal', title: 'Modal' }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider value={DefaultTheme}>
        <RootLayoutNav />
        <StatusBar style="dark" />
      </ThemeProvider>
    </AuthProvider>
  );
}
