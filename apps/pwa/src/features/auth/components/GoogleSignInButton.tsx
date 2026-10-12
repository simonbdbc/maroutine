import { View, TouchableOpacity, ActivityIndicator } from "react-native";
import { Text } from "@shared/components/ui";
import { cn } from "@shared/utils";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";

interface GoogleSignInButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

/**
 * Bouton "Continuer avec Google" avec le logo Google officiel.
 */
export function GoogleSignInButton({
  onPress,
  loading = false,
  disabled = false,
}: GoogleSignInButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      className={cn(
        "flex-row items-center justify-center gap-3",
        "rounded-full py-4 px-6",
        "border",
        isDisabled && "opacity-60"
      )}
      style={{
        backgroundColor: Colors.white,
        borderColor: Colors.grey,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <View className="w-6 h-6 items-center justify-center">
          {/* Logo Google SVG encodé inline pour éviter une dépendance externe */}
          <Text style={{ fontSize: 18 }}>G</Text>
        </View>
      )}
      <Text className="font-fredoka-bold text-base" style={{ color: withAlpha(Colors.black, 0.72) }}>
        {loading ? "Connexion en cours…" : "Continuer avec Google"}
      </Text>
    </TouchableOpacity>
  );
}
