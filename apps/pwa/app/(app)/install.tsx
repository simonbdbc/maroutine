import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge, Button, Card, Text } from "@shared/components/ui";
import {
  AppVersionInfo,
  ConnectionStatus,
  InstallAppButton,
  PwaDiagnosticsPanel,
  usePwa,
} from "@shared/pwa";
import {
  PwaInstructionList,
  PwaSectionHeader,
  PwaStatusRow,
} from "@shared/pwa/components/PwaPrimitives";
import { Colors } from "@shared/theme";

const INSTALL_INSTRUCTIONS = [
  {
    title: "iPhone ou iPad avec Safari",
    items: [
      "Ouvrir maroutine.app dans Safari.",
      "Toucher Partager puis Sur l'ecran d'accueil.",
      "Valider le nom avec Ajouter.",
      "Ouvrir Maroutine depuis l'icone creee.",
    ],
  },
  {
    title: "Android avec Chrome ou Edge",
    items: [
      "Utiliser le bouton Installer lorsqu'il est disponible.",
      "Sinon ouvrir le menu du navigateur.",
      "Choisir Installer l'application ou Ajouter a l'ecran d'accueil.",
      "Confirmer l'installation.",
    ],
  },
  {
    title: "Ordinateur avec Chrome ou Edge",
    items: [
      "Utiliser le bouton Installer lorsqu'il est disponible.",
      "Sinon ouvrir le menu du navigateur ou l'icone de la barre d'adresse.",
      "Choisir Installer Maroutine.",
      "Lancer ensuite l'application en mode autonome.",
    ],
  },
];

export default function InstallAppScreen() {
  const router = useRouter();
  const { displayMode, installStatus, serviceWorkerStatus } = usePwa();

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
          <Text variant="h3">Installer l'application</Text>
          <Text style={{ fontSize: 14, lineHeight: 20 }}>
            Ajoute Maroutine a l'ecran d'accueil pour l'ouvrir comme une application. La
            confirmation finale reste geree par le navigateur ou le systeme.
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
              <Text variant="title">Etat detecte</Text>
              <Text variant="caption">
                Le statut est actualise apres installation ou changement de mode.
              </Text>
            </View>
            <Badge
              label={installStatus}
              variant={installStatus === "installed" ? "success" : "primary"}
            />
          </View>
          <View style={{ gap: 8 }}>
            <PwaStatusRow label="Installation" value={installStatus} />
            <PwaStatusRow label="Mode d'affichage" value={displayMode} />
            <PwaStatusRow label="Service worker" value={serviceWorkerStatus} />
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Button
              className="min-w-[160px] flex-1 px-5 py-3"
              label="Tableau de bord PWA"
              onPress={() => router.push("/(app)/pwa" as never)}
              variant="outline"
            />
            <Button
              className="min-w-[160px] flex-1 px-5 py-3"
              label="Desinstallation"
              onPress={() => router.push("/(app)/uninstall" as never)}
              variant="outline"
            />
          </View>
        </Card>

        <InstallAppButton />

        <Card className="gap-3 p-4">
          <PwaSectionHeader label="Prerequis" />
          <PwaInstructionList
            items={[
              "L'application doit etre ouverte en HTTPS, sauf sur localhost.",
              "Le manifest et les icones doivent etre accessibles.",
              "Le service worker doit etre actif pour l'ouverture hors ligne et les mises a jour.",
              "Un navigateur non compatible peut continuer a utiliser Maroutine comme site web.",
            ]}
          />
        </Card>

        {INSTALL_INSTRUCTIONS.map((section) => (
          <Card className="gap-3 p-4" key={section.title}>
            <Text variant="title">{section.title}</Text>
            <PwaInstructionList items={section.items} />
          </Card>
        ))}

        <AppVersionInfo />
        <PwaDiagnosticsPanel />
      </ScrollView>
    </SafeAreaView>
  );
}
