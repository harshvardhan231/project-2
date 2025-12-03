import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { JournalProvider } from "@/providers/JournalProvider";
import { AudioProvider } from "@/providers/AudioProvider";
import { UserProvider } from "@/providers/UserProvider";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="crisis" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="export" options={{ presentation: "modal", title: "Export Data" }} />
      <Stack.Screen name="checkin" options={{ headerShown: false }} />
      <Stack.Screen name="summary" options={{ headerShown: false }} />
      <Stack.Screen name="breathing" options={{ headerShown: false }} />
      <Stack.Screen name="garden" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <UserProvider>
          <AudioProvider>
            <JournalProvider>
              <RootLayoutNav />
            </JournalProvider>
          </AudioProvider>
        </UserProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}