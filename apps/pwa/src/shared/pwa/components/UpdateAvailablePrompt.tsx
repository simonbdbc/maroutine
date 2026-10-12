import { View } from "react-native";
import { Button, Card, Text } from "@shared/components/ui";
import { usePwa } from "../PwaProvider";

export function UpdateAvailablePrompt() {
  const {
    applyUpdate,
    dismissUpdate,
    isUpdateAvailable,
    lastUpdateError,
    remoteBuildInfo,
    updateStatus,
  } = usePwa();
  if (!isUpdateAvailable && updateStatus !== "error") return null;
  const isUpdating = ["updating", "reloadRequired", "applied"].includes(updateStatus);

  return (
    <Card className="gap-3 p-4" variant="flat">
      <View style={{ gap: 3 }}>
        <Text variant="title">Mise a jour disponible</Text>
        <Text variant="caption">
          {remoteBuildInfo
            ? `Version ${remoteBuildInfo.appVersion}, build ${remoteBuildInfo.buildId}. Elle peut etre activee sans perdre les donnees en cours.`
            : "Une nouvelle version peut etre activee sans perdre les donnees en cours."}
        </Text>
      </View>
      {lastUpdateError ? <Text style={{ fontSize: 13 }}>{lastUpdateError}</Text> : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Button
          className="min-w-[150px] flex-1 px-5 py-3"
          label={isUpdating ? "Mise a jour..." : "Mettre a jour"}
          loading={isUpdating}
          onPress={() => void applyUpdate()}
        />
        {updateStatus !== "forced" ? (
          <Button
            className="min-w-[110px] px-5 py-3"
            disabled={isUpdating}
            label="Plus tard"
            onPress={dismissUpdate}
            variant="ghost"
          />
        ) : null}
      </View>
    </Card>
  );
}
