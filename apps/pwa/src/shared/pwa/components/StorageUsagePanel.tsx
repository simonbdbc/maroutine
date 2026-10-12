import { View } from "react-native";
import { Badge, Button, Card, Text, useAppDialog } from "@shared/components/ui";
import { usePwa } from "../PwaProvider";
import { formatPwaBytes, PwaStatusRow } from "./PwaPrimitives";

export function StorageUsagePanel() {
  const appDialog = useAppDialog();
  const { clearPwaCaches, diagnostics, resetPwaRuntime } = usePwa();
  const usageLabel = formatPwaBytes(diagnostics?.storageUsageBytes ?? null);
  const quotaLabel = formatPwaBytes(diagnostics?.storageQuotaBytes ?? null);

  const confirmClearCaches = () => {
    appDialog.confirmDialog({
      title: "Vider les caches PWA",
      message:
        "Le shell et les fichiers temporaires seront supprimes. Les comptes et donnees metier sont conserves.",
      confirmLabel: "Vider",
      onConfirm: () => void clearPwaCaches(),
    });
  };
  const confirmRuntimeReset = () => {
    appDialog.confirmDialog({
      title: "Reparer l'application",
      message:
        "Le service worker et ses caches seront retires, puis la page sera rechargee. Les donnees metier sont conservees.",
      confirmLabel: "Reparer",
      onConfirm: () => void resetPwaRuntime(),
    });
  };

  return (
    <>
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
            <Text variant="title">Stockage local</Text>
            <Text variant="caption">
              Caches du shell, images consultees et donnees du navigateur.
            </Text>
          </View>
          <Badge label={usageLabel} variant="primary" />
        </View>
        <View style={{ gap: 8 }}>
          <PwaStatusRow label="Utilise" value={usageLabel} />
          <PwaStatusRow label="Quota estime" value={quotaLabel} />
          <PwaStatusRow label="Caches PWA" value={String(diagnostics?.caches.length ?? 0)} />
        </View>
        <Text variant="caption">
          Le nettoyage PWA ne supprime ni la session, ni les profils, ni les routines synchronisees.
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Button
            className="min-w-[160px] flex-1 px-5 py-3"
            label="Vider les caches"
            onPress={confirmClearCaches}
            variant="outline"
          />
          <Button
            className="min-w-[160px] flex-1 px-5 py-3"
            label="Reparer la PWA"
            onPress={confirmRuntimeReset}
            variant="outline"
          />
        </View>
      </Card>
      {appDialog.dialog}
    </>
  );
}
