import { View } from "react-native";
import { Badge } from "@shared/components/ui";
import { usePwa } from "../PwaProvider";

export function ConnectionStatus() {
  const { networkStatus, serviceWorkerStatus } = usePwa();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      <Badge
        accessibilityLabel={
          networkStatus === "connected" ? "Application en ligne" : "Application hors ligne"
        }
        label={networkStatus === "connected" ? "En ligne" : "Hors ligne"}
        variant={networkStatus === "connected" ? "success" : "gold"}
      />
      <Badge
        label={`SW ${serviceWorkerStatus}`}
        variant={serviceWorkerStatus === "active" ? "success" : "muted"}
      />
    </View>
  );
}
