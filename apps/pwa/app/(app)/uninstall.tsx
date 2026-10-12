import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge, Button, Card, Text } from "@shared/components/ui";
import { AppVersionInfo, StorageUsagePanel, usePwa } from "@shared/pwa";
import { PwaInstructionList, PwaStatusRow } from "@shared/pwa/components/PwaPrimitives";
import { Colors } from "@shared/theme";

const UNINSTALL_INSTRUCTIONS = [
  {
    title: "Ordinateur avec Chrome ou Edge",
    items: [
      "Ouvrir l'application Maroutine installee.",
      "Ouvrir le menu de la fenetre ou les informations de l'application.",
      "Choisir Desinstaller ou Supprimer Maroutine.",
    ],
  },
  {
    title: "Android",
    items: [
      "Faire un appui long sur l'icone Maroutine.",
      "Choisir Desinstaller ou Retirer de l'ecran d'accueil.",
      "Confirmer si le telephone le demande.",
    ],
  },
  {
    title: "iPhone ou iPad",
    items: [
      "Faire un appui long sur l'icone Maroutine.",
      "Choisir Supprimer le signet ou Supprimer l'app.",
      "Les donnees Safari peuvent rester jusqu'a leur suppression dans les reglages.",
    ],
  },
];

export default function UninstallAppScreen() {
  const router = useRouter();
  const { displayMode, installStatus } = usePwa();

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
          <Text variant="h3">Desinstaller l'application</Text>
          <Text style={{ fontSize: 14, lineHeight: 20 }}>
            La suppression de l'icone est geree par le navigateur ou le systeme. Maroutine peut
            uniquement nettoyer ses caches web et aider a une reinstallation propre.
          </Text>
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
              <Text variant="title">Etat local</Text>
              <Text variant="caption">
                La suppression de l'icone ne supprime pas toujours les donnees du navigateur.
              </Text>
            </View>
            <Badge
              label={displayMode}
              variant={installStatus === "installed" ? "success" : "muted"}
            />
          </View>
          <View style={{ gap: 8 }}>
            <PwaStatusRow label="Installation" value={installStatus} />
            <PwaStatusRow label="Mode" value={displayMode} />
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Button
              className="min-w-[150px] flex-1 px-5 py-3"
              label="Installation"
              onPress={() => router.push("/(app)/install" as never)}
              variant="outline"
            />
            <Button
              className="min-w-[150px] flex-1 px-5 py-3"
              label="Tableau de bord PWA"
              onPress={() => router.push("/(app)/pwa" as never)}
              variant="outline"
            />
          </View>
        </Card>

        {UNINSTALL_INSTRUCTIONS.map((section) => (
          <Card className="gap-3 p-4" key={section.title}>
            <Text variant="title">{section.title}</Text>
            <PwaInstructionList items={section.items} />
          </Card>
        ))}

        <StorageUsagePanel />

        <Card className="gap-3 p-4">
          <Text variant="title">Reinstallation propre</Text>
          <PwaInstructionList
            items={[
              "Supprimer l'icone installee depuis le navigateur ou le systeme.",
              "Vider les caches PWA depuis le panneau de stockage.",
              "Recharger Maroutine dans le navigateur.",
              "Relancer l'installation depuis l'ecran Installer.",
            ]}
          />
        </Card>

        <AppVersionInfo />
      </ScrollView>
    </SafeAreaView>
  );
}
