import { View, type ViewProps } from "react-native";
import { cn } from "@shared/utils";

interface CardProps extends ViewProps {
  className?: string;
  variant?: "default" | "elevated" | "flat";
}

/**
 * Composant Card — surface blanche avec ombre et border-radius.
 *
 * @example
 * <Card className="p-4 mb-3">
 *   <Text variant="title">Petit Déjeuner</Text>
 * </Card>
 */
export function Card({ variant = "default", className, ...props }: CardProps) {
  const base = "bg-surface rounded-2xl";
  const variants = {
    default: "shadow-md border border-border",
    elevated: "shadow-lg border border-border",
    flat: "border border-border",
  };

  return (
    <View
      className={cn(base, variants[variant], className)}
      {...props}
    />
  );
}
