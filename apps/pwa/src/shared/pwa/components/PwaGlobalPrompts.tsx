import { View } from "react-native";
import { Card, Text } from "@shared/components/ui";
import { usePwa } from "../PwaProvider";
import { InstallAppBanner } from "./InstallAppBanner";
import { UpdateAvailablePrompt } from "./UpdateAvailablePrompt";

export function PwaGlobalPrompts() {
  const { networkStatus } = usePwa();
  return (
    <View style={{ paddingBottom: 8, width: "100%" }}>
      <View style={{ gap: 8, width: "100%" }}>
        <InstallAppBanner />
        {networkStatus === "offline" ? (
          <Card className="gap-1 p-3" variant="flat">
            <Text variant="title">Mode hors ligne</Text>
            <Text variant="caption">Les donnees deja chargees restent disponibles.</Text>
          </Card>
        ) : null}
        <UpdateAvailablePrompt />
      </View>
    </View>
  );
}
