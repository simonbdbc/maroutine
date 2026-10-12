import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge, Button, Card, Text } from "@shared/components/ui";
import {
  AppVersionInfo,
  ConnectionStatus,
  InstallAppButton,
  PwaDiagnosticsPanel,
  StorageUsagePanel,
  UpdateAvailablePrompt,
  usePwa,
} from "@shared/pwa";
import { PwaStatusRow } from "@shared/pwa/components/PwaPrimitives";
import { Colors } from "@shared/theme";

export default function PwaDashboardScreen() {
  const router = useRouter();
  const { checkForUpdate, displayMode, installStatus, isUpdateAvailable, serviceWorkerStatus } =
    usePwa();

  return (
    <SafeAreaView style={{ backgroundColor: Colors.white, flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          alignSelf: "center",
          gap: 16,
          maxWidth: 760,
          paddingBottom: 60,
          paddingHorizontal: 20,
          paddingTop: 20,
          width: "100%",
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 6 }}>
          <Text variant="h3">Tableau de bord PWA</Text>
          <Text style={{ fontSize: 14, lineHeight: 20 }}>
            Installation, mises a jour, stockage local, version et diagnostic de l'application.
          </Text>
          <ConnectionStatus />
        </View>

        <Card className="gap-3 p-4">
          <View
            style={{
              alignItems: "flex-start",
              flexDirection: "row",
              gap: 10,
              justifyContent: "space-between",
            }}
          >
            <View style={{ flex: 1, gap: 3 }}>
              <Text variant="title">Gestion PWA</Text>
              <Text variant="caption">Etat courant et acces aux procedures par plateforme.</Text>
            </View>
            <Badge
              label={isUpdateAvailable ? "Mise a jour" : installStatus}
              variant={
                isUpdateAvailable ? "gold" : installStatus === "installed" ? "success" : "primary"
              }
            />
          </View>
          <View style={{ gap: 8 }}>
            <PwaStatusRow label="Installation" value={installStatus} />
            <PwaStatusRow label="Mode" value={displayMode} />
            <PwaStatusRow label="Service worker" value={serviceWorkerStatus} />
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Button
              className="min-w-[145px] flex-1 px-5 py-3"
              label="Installation"
              onPress={() => router.push("/(app)/install" as never)}
              variant="outline"
            />
            <Button
              className="min-w-[145px] flex-1 px-5 py-3"
              label="Desinstallation"
              onPress={() => router.push("/(app)/uninstall" as never)}
              variant="outline"
            />
            <Button
              className="min-w-[145px] flex-1 px-5 py-3"
              label="Verifier les mises a jour"
              onPress={() => void checkForUpdate()}
              variant="secondary"
            />
          </View>
        </Card>

        <UpdateAvailablePrompt />
        <InstallAppButton />
        <AppVersionInfo />
        <StorageUsagePanel />
        <PwaDiagnosticsPanel />
      </ScrollView>
    </SafeAreaView>
  );
}
