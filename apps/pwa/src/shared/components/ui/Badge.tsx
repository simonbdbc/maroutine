import { View, type ViewProps } from "react-native";
import { Text } from "./Text";
import { cn } from "@shared/utils";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";

interface BadgeProps extends ViewProps {
  label: string;
  variant?: "gold" | "primary" | "success" | "muted";
  size?: "sm" | "md";
  className?: string;
}

/**
 * Composant Badge — pour afficher les étoiles, scores, statuts.
 *
 * @example
 * <Badge label="120 étoiles" variant="gold" />
 * <Badge label="4/8" variant="primary" size="sm" />
 */
export function Badge({
  label,
  variant = "primary",
  size = "md",
  className,
  style,
  ...props
}: BadgeProps) {
  const variantStyles = {
    gold: {
      backgroundColor: Colors.secondaryPastel,
      borderColor: Colors.secondary,
    },
    primary: {
      backgroundColor: Colors.primaryPastel,
      borderColor: withAlpha(Colors.primary, 0.45),
    },
    success: {
      backgroundColor: withAlpha(Colors.success, 0.13),
      borderColor: withAlpha(Colors.success, 0.4),
    },
    muted: {
      backgroundColor: Colors.white,
      borderColor: Colors.grey,
    },
  };

  const textStyles = {
    gold: { color: Colors.warning },
    primary: { color: Colors.primary },
    success: { color: Colors.success },
    muted: { color: withAlpha(Colors.black, 0.72) },
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 rounded-full",
    md: "px-3 py-1 rounded-full",
  };

  const textSizeClasses = {
    sm: "text-xs font-fredoka-semi",
    md: "text-sm font-fredoka-bold",
  };

  return (
    <View
      className={cn("border", sizeClasses[size], className)}
      style={[variantStyles[variant], style]}
      {...props}
    >
      <Text className={cn(textSizeClasses[size])} style={textStyles[variant]}>
        {label}
      </Text>
    </View>
  );
}
