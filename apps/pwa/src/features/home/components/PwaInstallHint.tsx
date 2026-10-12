import { useEffect, useMemo, useState } from "react";
import { Platform, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { AppIcon, Text } from "@shared/components/ui";
import { isIOSBrowser, isLikelySafari, isPwaInstalled, usePwa } from "@shared/pwa";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";

const DISMISS_STORAGE_KEY = "maroutine:pwa-install-hint:dismissed:v1";

type InstallHint = {
  title: string;
  lines: string[];
} | null;

type IOSNavigator = Navigator & {
  brave?: unknown;
  standalone?: boolean;
  maxTouchPoints?: number;
};

function resolveInstallHint(isAppInstalled: boolean): InstallHint {
  if (Platform.OS !== "web") return null;
  if (typeof window === "undefined" || typeof navigator === "undefined") return null;

  const nav = navigator as IOSNavigator;
  const env = {
    brave: nav.brave,
    displayModeStandalone: window.matchMedia?.("(display-mode: standalone)")?.matches ?? false,
    maxTouchPoints: nav.maxTouchPoints,
    platform: nav.platform,
    standalone: nav.standalone,
    userAgent: nav.userAgent,
    vendor: nav.vendor,
  };

  if (isAppInstalled || !isIOSBrowser(env) || isPwaInstalled(env)) {
    return null;
  }

  if (isLikelySafari(env)) {
    return {
      title: "Installer l'app sur iPad/iPhone",
      lines: [
        "1. Touchez Partager (carré avec flèche).",
        "2. Choisissez \"Sur l'écran d'accueil\".",
        '3. Validez avec "Ajouter".',
      ],
    };
  }

  return {
    title: "Installation PWA limitée dans ce navigateur iOS",
    lines: [
      "Ce navigateur iOS ne propose pas toujours l'installation PWA.",
      "Ouvrez cette page dans Safari pour installer l'app.",
      "Ensuite: Partager -> Sur l'ecran d'accueil -> Ajouter.",
    ],
  };
}

export function PwaInstallHint() {
  const { isAppInstalled } = usePwa();
  const hint = useMemo(() => resolveInstallHint(isAppInstalled), [isAppInstalled]);
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const saved = window.localStorage.getItem(DISMISS_STORAGE_KEY);
    if (saved === "1") {
      setDismissed(true);
    }
  }, []);

  if (!hint || dismissed) return null;

  return (
    <View
      style={{
        marginHorizontal: 12,
        marginTop: 8,
        marginBottom: 4,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 16,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: withAlpha(Colors.black, 0.18),
      }}
    >
      <View className="flex-row items-start justify-between gap-2">
        <View style={{ flex: 1, gap: 4 }}>
          <Text
            style={{
              fontFamily: "Fredoka_700Bold",
              fontSize: 14,
              color: Colors.black,
            }}
          >
            {hint.title}
          </Text>
          {hint.lines.map((line) => (
            <Text
              key={line}
              style={{
                fontSize: 12,
                color: Colors.black,
                lineHeight: 17,
              }}
            >
              {line}
            </Text>
          ))}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Ouvrir les instructions d'installation"
            onPress={() => router.push("/(app)/install" as never)}
            style={{
              alignSelf: "flex-start",
              marginTop: 2,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: withAlpha(Colors.primary, 0.28),
              backgroundColor: withAlpha(Colors.primary, 0.08),
              paddingHorizontal: 10,
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: Colors.primary, fontFamily: "Fredoka_700Bold", fontSize: 12 }}>
              Voir les instructions
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Fermer l'aide d'installation"
          onPress={() => {
            setDismissed(true);
            if (Platform.OS === "web" && typeof window !== "undefined") {
              window.localStorage.setItem(DISMISS_STORAGE_KEY, "1");
            }
          }}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: withAlpha(Colors.black, 0.1),
          }}
        >
          <AppIcon name="close" size={16} tintColor={Colors.black} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
