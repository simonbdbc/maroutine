import { useRouter } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, Text } from "@shared/components/ui";
import { ConnectionStatus, usePwa } from "@shared/pwa";
import { Colors } from "@shared/theme";

export default function OfflineScreen() {
  const router = useRouter();
  const { networkStatus } = usePwa();
  return (
    <SafeAreaView
      style={{
        alignItems: "center",
        backgroundColor: Colors.white,
        flex: 1,
        justifyContent: "center",
        padding: 20,
      }}
    >
      <Card className="w-full max-w-[480px] gap-4 p-5">
        <View style={{ gap: 6 }}>
          <Text variant="h3">Connexion indisponible</Text>
          <Text style={{ fontSize: 14, lineHeight: 20 }}>
            Certaines donnees distantes ne peuvent pas etre chargees. Les informations deja
            disponibles dans le navigateur restent accessibles.
          </Text>
        </View>
        <ConnectionStatus />
        <Button
          label={networkStatus === "connected" ? "Retour a l'accueil" : "Reessayer"}
          onPress={() =>
            networkStatus === "connected"
              ? router.replace("/(app)/home" as never)
              : typeof window !== "undefined" && window.location.reload()
          }
        />
      </Card>
    </SafeAreaView>
  );
}
