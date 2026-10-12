import { View } from "react-native";
import { Badge, Button, Card, Text } from "@shared/components/ui";
import { usePwa } from "../PwaProvider";
import { PwaStatusRow } from "./PwaPrimitives";

export function PwaDiagnosticsPanel() {
  const { diagnostics, refreshDiagnostics } = usePwa();

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
          <Text variant="title">Diagnostic PWA</Text>
          <Text variant="caption">Etat du manifest, du worker et des caches.</Text>
        </View>
        <Badge
          label={diagnostics?.serviceWorkerActive ? "Actif" : "A verifier"}
          variant={diagnostics?.serviceWorkerActive ? "success" : "gold"}
        />
      </View>
      <View style={{ gap: 8 }}>
        <PwaStatusRow label="Manifest detecte" value={yesNo(diagnostics?.manifestDetected)} />
        <PwaStatusRow
          label="Service worker supporte"
          value={yesNo(diagnostics?.serviceWorkerSupported)}
        />
        <PwaStatusRow
          label="Service worker actif"
          value={yesNo(diagnostics?.serviceWorkerActive)}
        />
        <PwaStatusRow label="Mode d'affichage" value={diagnostics?.displayMode ?? "inconnu"} />
        <PwaStatusRow label="Reseau" value={diagnostics?.networkStatus ?? "inconnu"} />
        <PwaStatusRow label="Caches" value={diagnostics?.caches.join(", ") || "aucun"} />
        <PwaStatusRow
          label="Derniere erreur update"
          value={diagnostics?.lastUpdateError ?? "aucune"}
        />
      </View>
      <Button
        className="px-5 py-3"
        label="Actualiser le diagnostic"
        onPress={() => void refreshDiagnostics()}
        variant="secondary"
      />
    </Card>
  );
}

function yesNo(value: boolean | undefined): string {
  if (value === undefined) return "inconnu";
  return value ? "oui" : "non";
}
