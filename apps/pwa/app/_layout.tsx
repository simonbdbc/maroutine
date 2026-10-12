import "../src/shared/theme/global.css";

import { LogBox } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CanonicalUrlBanner, PwaProvider } from "@shared/pwa";
import { useAppFonts } from "@shared/hooks/useAppFonts";

LogBox.ignoreLogs(["SafeAreaView has been deprecated and will be removed in a future release."]);

export default function RootLayout() {
  const { appReady } = useAppFonts();

  if (!appReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <PwaProvider>
        <CanonicalUrlBanner />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="createurs" />
          <Stack.Screen name="offline" />
          {/* Groupe Auth — login, onboarding */}
          <Stack.Screen name="(auth)" />
          {/* Groupe App — écrans principaux */}
          <Stack.Screen name="(app)" />
        </Stack>
      </PwaProvider>
    </GestureHandlerRootView>
  );
}
