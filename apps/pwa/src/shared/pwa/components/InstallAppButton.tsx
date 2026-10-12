import { View } from "react-native";
import { Badge, Button, Card, Text } from "@shared/components/ui";
import { usePwa } from "../PwaProvider";

export function InstallAppButton() {
  const {
    installError,
    installStatus,
    isInstallPromptAvailable,
    promptInstall,
    resetInstallDismissal,
  } = usePwa();
  const isInstalled = installStatus === "installed";
  const isInstallable = isInstallPromptAvailable && !isInstalled;

  return (
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
          <Text variant="title">Installation</Text>
          <Text variant="caption">
            {installStatus === "manual"
              ? "L'installation se fait depuis le menu du navigateur."
              : "Etat detecte par le navigateur ou le systeme."}
          </Text>
        </View>
        <Badge
          label={installStatusLabel(installStatus)}
          variant={isInstalled ? "success" : "primary"}
        />
      </View>

      {installStatus === "manual" ? (
        <Text style={{ fontSize: 13, lineHeight: 18 }}>
          Sur iPhone ou iPad, ouvre Partager puis Sur l'ecran d'accueil.
        </Text>
      ) : null}
      {installError ? <Text style={{ fontSize: 13 }}>{installError}</Text> : null}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Button
          accessibilityLabel="Installer l'application"
          className="min-w-[150px] flex-1 px-5 py-3"
          disabled={!isInstallable}
          label={isInstalled ? "Deja installee" : "Installer"}
          onPress={() => void promptInstall()}
        />
        {installStatus === "dismissed" ? (
          <Button
            className="min-w-[150px] flex-1 px-5 py-3"
            label="Reafficher"
            onPress={resetInstallDismissal}
            variant="outline"
          />
        ) : null}
      </View>
    </Card>
  );
}

function installStatusLabel(status: ReturnType<typeof usePwa>["installStatus"]): string {
  switch (status) {
    case "available":
      return "Disponible";
    case "installed":
      return "Installee";
    case "manual":
      return "Manuel";
    case "dismissed":
      return "Masquee";
    case "error":
      return "Erreur";
    case "checking":
      return "Detection";
    default:
      return "Indisponible";
  }
}
