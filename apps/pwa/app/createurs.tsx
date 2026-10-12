import { LinearGradient } from "expo-linear-gradient";
import { Linking, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StickerImage } from "@features/stickers";
import { Button, Text } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import { resolveConfiguredAppOrigin } from "@shared/pwa/appConfig";

const creatorContactEmail = process.env.EXPO_PUBLIC_CREATOR_CONTACT_EMAIL?.trim();
const appUrl = resolveConfiguredAppOrigin();

const communityBenefits = [
  "Une solution complète pour les routines du quotidien.",
  "Un premier mois offert avec ton code créateur.",
  "Une app à tester sans suivre un compte social Maroutine.",
];

const creatorBenefits = [
  "Un code createur réservé, par exemple NOM1FREE.",
  "1er mois offert pour les abonnés qui utilisent le code.",
  "30% du CA HT encaissé pendant 12 mois, après mise en place du tracking.",
];

const contentAngles = [
  "Comment aider un enfant à devenir plus autonome en suivant sa routine.",
  "Transformer les petites responsabilites en victoires visibles.",
  "Avoir une routine web centralisé utilisable en WE, vacances et partageable.",
];

const programRules = [
  "Test de partenariat de 3 mois, renouvelable.",
  "Pas de commission sur essais gratuits, remboursements, impayes.",
  "Paiement mensuel a 30-45 jours, avec minimum de paiement de 50 euros.",
];

function openCreatorEmail() {
  if (!creatorContactEmail) return;

  const subject = encodeURIComponent("Partenariat createur Maroutine");
  const body = encodeURIComponent(
    `Bonjour,\n\nJe souhaite en savoir plus sur le programme createur Maroutine.\n\nLien app: ${appUrl}\n\n`
  );

  void Linking.openURL(`mailto:${creatorContactEmail}?subject=${subject}&body=${body}`);
}

export default function CreatorsPage() {
  const hasContactEmail = Boolean(creatorContactEmail);

  return (
    <LinearGradient
      colors={[Colors.primaryPastel, Colors.white, Colors.secondaryPastel]}
      locations={[0, 0.58, 1]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingVertical: 28,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full max-w-[980px] gap-8 self-center">
            <View
              className="gap-5 rounded-3xl px-5 py-6"
              style={{
                backgroundColor: withAlpha(Colors.white, 0.88),
                borderWidth: 1,
                borderColor: withAlpha(Colors.black, 0.08),
              }}
            >
              <View className="flex-row items-center gap-3">
                <View
                  className="h-14 w-14 items-center justify-center rounded-full"
                  style={{ backgroundColor: withAlpha(Colors.primary, 0.14) }}
                >
                  <StickerImage stickerKey="star-sticker" size={56} />
                </View>
                <View className="flex-1">
                  <Text variant="caption" className="font-fredoka-bold uppercase text-primary">
                    Programme createur
                  </Text>
                  <Text variant="h1">Parler de Maroutine</Text>
                </View>
              </View>

              <View className="gap-3">
                <Text variant="h3">
                  Aide les familles a rendre les enfants plus autonomes dans leurs routines.
                </Text>
                <Text variant="body" className="text-text-secondary">
                  Maroutine est une app web de routines quotidiennes gamifiees pour enfants : matin,
                  devoirs, coucher, petites responsabilites et recompenses.
                </Text>
              </View>

              <View className="flex-row flex-wrap gap-3">
                {["Parents", "Enfants", "Autonomie", "Routines", "Affiliation"].map((label) => (
                  <View
                    key={label}
                    className="rounded-full px-4 py-2"
                    style={{ backgroundColor: withAlpha(Colors.primary, 0.1) }}
                  >
                    <Text variant="caption" className="font-fredoka-semi text-primary">
                      {label}
                    </Text>
                  </View>
                ))}
              </View>

              <View className="gap-3">
                <Button
                  label={
                    hasContactEmail ? "Proposer une collaboration" : "Email createur a configurer"
                  }
                  onPress={openCreatorEmail}
                  disabled={!hasContactEmail}
                />
                <Text variant="caption" className="text-center text-text-muted">
                  Code exemple : NOM1FREE. Avantage abonne : 1er mois offert.
                </Text>
              </View>
            </View>

            <View className="gap-4 md:flex-row">
              <InfoPanel
                stickerKey="unicorn"
                title="Ce que gagne ton audience"
                items={communityBenefits}
              />
              <InfoPanel stickerKey="triceratops" title="Programme V1" items={creatorBenefits} />
            </View>

            <View className="gap-4 md:flex-row">
              <InfoPanel stickerKey="griffin" title="Idees de contenus" items={contentAngles} />
              <InfoPanel stickerKey="phoenix" title="Cadre createur" items={programRules} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function InfoPanel({
  stickerKey,
  title,
  items,
}: {
  stickerKey: string;
  title: string;
  items: string[];
}) {
  return (
    <View
      className="min-w-[280px] flex-1 gap-4 rounded-2xl px-5 py-5"
      style={{
        backgroundColor: withAlpha(Colors.white, 0.9),
        borderWidth: 1,
        borderColor: withAlpha(Colors.black, 0.08),
      }}
    >
      <View className="flex-row items-center gap-3">
        <StickerImage stickerKey={stickerKey} size={44} />
        <Text variant="h3">{title}</Text>
      </View>
      <View className="gap-3">
        {items.map((item) => (
          <View key={item} className="flex-row gap-3">
            <Text className="font-fredoka-bold text-primary">-</Text>
            <Text className="flex-1 text-text-secondary">{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
