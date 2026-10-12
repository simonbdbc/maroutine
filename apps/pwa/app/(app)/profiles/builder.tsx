import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text } from "react-native";
import { Colors } from "@shared/theme";
import { RoutineBuilderScreen } from "@features/catalog/components/RoutineBuilderScreen";

export default function BuilderRoute() {
  const { profileId, profileName, primaryColor } = useLocalSearchParams<{
    profileId: string;
    profileName: string;
    primaryColor: string;
  }>();

  if (!profileId || !profileName) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text>Profil non trouvé</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }} edges={["top"]}>
      <RoutineBuilderScreen
        profileId={profileId}
        profileName={profileName}
        primaryColor={primaryColor ?? Colors.primary}
        onClose={() => router.replace("/(app)/profiles")}
      />
    </SafeAreaView>
  );
}
