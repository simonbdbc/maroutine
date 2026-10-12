import { View } from "react-native";
import { Badge, Card, Text } from "@shared/components/ui";
import { APP_VERSION } from "../appConfig";
import { usePwa } from "../PwaProvider";
import { PwaStatusRow } from "./PwaPrimitives";

export function AppVersionInfo() {
  const { buildInfo, displayMode, remoteBuildInfo, serviceWorkerStatus } = usePwa();
  const info = buildInfo ?? remoteBuildInfo;

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
          <Text variant="title">Version</Text>
          <Text variant="caption">Informations utiles au support et a la validation.</Text>
        </View>
        <Badge label={info?.appVersion ?? APP_VERSION} variant="primary" />
      </View>
      <View style={{ gap: 8 }}>
        <PwaStatusRow label="Application" value={info?.appName ?? "Maroutine"} />
        <PwaStatusRow label="Version" value={info?.appVersion ?? APP_VERSION} />
        <PwaStatusRow label="Build" value={info?.buildId ?? "inconnu"} />
        <PwaStatusRow label="Commit" value={info?.commitSha ?? "inconnu"} />
        <PwaStatusRow label="Canal" value={info?.releaseChannel ?? "inconnu"} />
        <PwaStatusRow label="Date" value={info?.buildDate ?? "inconnue"} />
        <PwaStatusRow label="Mode" value={displayMode} />
        <PwaStatusRow label="Service worker" value={serviceWorkerStatus} />
        <PwaStatusRow label="Support" value={info?.supportContact ?? "contact@maroutine.app"} />
      </View>
    </Card>
  );
}
