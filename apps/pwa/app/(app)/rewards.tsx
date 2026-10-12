import { useEffect } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@shared/theme";

function paramString(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default function RewardsScreen() {
  const params = useLocalSearchParams();
  const profileId = paramString(params.profileId);

  useEffect(() => {
    router.replace({
      pathname: "/(app)/home" as never,
      params: profileId ? { profileId } : {},
    });
  }, [profileId]);

  return <View style={{ flex: 1, backgroundColor: Colors.white }} />;
}
