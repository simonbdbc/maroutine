import { View } from "react-native";
import { Text, Button } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import { router } from "expo-router";

/**
 * État vide : aucune activité configurée pour le profil.
 * Invite à aller dans les profils pour configurer.
 */
export function EmptyRoutineState() {
  return (
    <View className="flex-1 items-center justify-center px-8 gap-4 py-20">
      <Text style={{ fontSize: 48 }}>📋</Text>
      <Text
        style={{
          fontFamily: "Fredoka_700Bold",
          fontSize: 20,
          color: withAlpha(Colors.black, 0.72),
          textAlign: "center",
        }}
      >
        Aucune routine configurée
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: withAlpha(Colors.black, 0.56),
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        Les activités et tâches sont configurées dans le profil de l'enfant via Supabase.
      </Text>
      <Button
        label="Voir les profils"
        variant="outline"
        onPress={() => router.push("/(app)/profiles")}
      />
    </View>
  );
}
