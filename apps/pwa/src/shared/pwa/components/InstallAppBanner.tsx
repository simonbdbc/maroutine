import { useRouter } from "expo-router";
import { View } from "react-native";
import { Button, Card, Text } from "@shared/components/ui";
import { usePwa } from "../PwaProvider";

export function InstallAppBanner() {
  const router = useRouter();
  const { dismissInstall, installStatus, isInstallPromotionVisible, promptInstall } = usePwa();
  if (!isInstallPromotionVisible) return null;
  const isManual = installStatus === "manual";

  return (
    <Card className="gap-3 p-4" variant="flat">
      <View style={{ gap: 3 }}>
        <Text variant="title">
          {isManual ? "Installer depuis le navigateur" : "Installer Maroutine"}
        </Text>
        <Text variant="caption">
          {isManual
            ? "Consulte les instructions adaptees a ton appareil."
            : "Ajoute l'application a l'ecran d'accueil pour l'ouvrir en mode autonome."}
        </Text>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Button
          className="min-w-[140px] flex-1 px-5 py-3"
          label={isManual ? "Voir les instructions" : "Installer"}
          onPress={() => (isManual ? router.push("/(app)/install" as never) : void promptInstall())}
        />
        <Button
          className="min-w-[110px] px-5 py-3"
          label="Plus tard"
          onPress={dismissInstall}
          variant="ghost"
        />
      </View>
    </Card>
  );
}
