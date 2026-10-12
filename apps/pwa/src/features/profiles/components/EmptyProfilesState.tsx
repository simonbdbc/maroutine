import { View } from "react-native";
import { Text } from "@shared/components/ui";

export function EmptyProfilesState() {
  return (
    <View className="flex-1 items-center justify-center px-8 gap-6">
      <View className="items-center gap-3">
        <Text style={{ fontSize: 72 }}>👦</Text>
        <Text variant="h3" className="text-center">
          Aucun profil enfant
        </Text>
        <Text variant="label" className="text-text-muted text-center leading-relaxed">
          Crée un profil pour chaque enfant.{"\n"}
          Chacun aura sa propre routine et ses stickers.
        </Text>
      </View>
    </View>
  );
}
