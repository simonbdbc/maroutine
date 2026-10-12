import { View, Image } from "react-native";
import { Text } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import type { AuthUser } from "../types";

interface UserAvatarProps {
  user: AuthUser | null;
  size?: number;
  fallbackEmoji?: string;
}

/**
 * Avatar utilisateur Google ou fallback emoji.
 * Utilisé dans le header de la HomeScreen.
 */
export function UserAvatar({
  user,
  size = 48,
  fallbackEmoji = "👦",
}: UserAvatarProps) {
  if (user?.avatarUrl) {
    return (
      <Image
        source={{ uri: user.avatarUrl }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 3,
          borderColor: withAlpha(Colors.black, 0.4),
        }}
      />
    );
  }

  // Fallback : initiale du nom ou emoji
  const initial = user?.displayName?.charAt(0).toUpperCase() ?? null;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: withAlpha(Colors.black, 0.2),
        borderWidth: 3,
        borderColor: withAlpha(Colors.black, 0.4),
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {initial ? (
        <Text
          style={{
            color: Colors.black,
            fontSize: size * 0.4,
            fontFamily: "Fredoka_700Bold",
          }}
        >
          {initial}
        </Text>
      ) : (
        <Text style={{ fontSize: size * 0.5 }}>{fallbackEmoji}</Text>
      )}
    </View>
  );
}
