import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore if splash has already been handled by the runtime.
});

interface UseFontsResult {
  appReady: boolean;
}

/**
 * Hook pour charger les fonts Fredoka.
 * Maintient le splash screen jusqu'à ce que les fonts soient prêtes.
 */
export function useAppFonts(): UseFontsResult {
  const [fontsLoaded, fontsError] = useFonts({
    Fredoka_400Regular: require("../../../assets/fonts/Fredoka_400Regular.ttf"),
    Fredoka_600SemiBold: require("../../../assets/fonts/Fredoka_600SemiBold.ttf"),
    Fredoka_700Bold: require("../../../assets/fonts/Fredoka_700Bold.ttf"),
  });
  const [startupTimeoutReached, setStartupTimeoutReached] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStartupTimeoutReached(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const appReady = fontsLoaded || !!fontsError || startupTimeoutReached;

  useEffect(() => {
    if (!appReady) {
      return;
    }
    SplashScreen.hideAsync().catch(() => {
      // No-op: splash may already be hidden.
    });
  }, [appReady]);

  return { appReady };
}
