import { useMemo } from "react";
import { Platform, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import { buildCanonicalAppUrl } from "./domainRedirect";

export function CanonicalUrlBanner() {
  const canonicalUrl = useMemo(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return null;
    return buildCanonicalAppUrl(window.location.href);
  }, []);

  if (!canonicalUrl) return null;

  function openCanonicalUrl() {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.assign(canonicalUrl as string);
    }
  }

  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: Colors.primary }}>
      <View
        style={{
          backgroundColor: Colors.primary,
          borderBottomWidth: 1,
          borderBottomColor: withAlpha(Colors.black, 0.16),
          paddingHorizontal: 14,
          paddingVertical: 9,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <Text
          style={{
            color: Colors.white,
            fontFamily: "Fredoka_600SemiBold",
            fontSize: 12,
            lineHeight: 16,
            textAlign: "center",
          }}
        >
          Redirigez-vous vers la nouvelle version de l'app en cliquant ici -&gt;
        </Text>
        <TouchableOpacity
          accessibilityRole="link"
          accessibilityLabel="Ouvrir l'adresse officielle"
          onPress={openCanonicalUrl}
          style={{
            minHeight: 32,
            borderRadius: 999,
            backgroundColor: Colors.white,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 12,
          }}
        >
          <Text style={{ color: Colors.primary, fontFamily: "Fredoka_700Bold", fontSize: 12 }}>
            maroutine.app
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
