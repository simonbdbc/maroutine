import {
  TouchableOpacity,
  type TouchableOpacityProps,
  ActivityIndicator,
  View,
} from "react-native";
import { Text } from "./Text";
import { cn } from "@shared/utils";
import { Colors } from "@shared/theme";

// ─── Variants ────────────────────────────────────────────────────────────────
const buttonVariants = {
  primary: "bg-primary rounded-full py-4 px-8 items-center justify-center flex-row gap-2",
  secondary: "bg-primary-pastel rounded-full py-4 px-8 items-center justify-center flex-row gap-2",
  outline:
    "border-2 border-primary rounded-full py-4 px-8 items-center justify-center flex-row gap-2",
  ghost: "rounded-full py-3 px-6 items-center justify-center flex-row gap-2",
  danger: "bg-error rounded-full py-4 px-8 items-center justify-center flex-row gap-2",
} as const;

const textVariants = {
  primary: "text-text-on-primary font-fredoka-bold text-base",
  secondary: "text-primary font-fredoka-bold text-base",
  outline: "text-primary font-fredoka-bold text-base",
  ghost: "text-text-secondary font-fredoka-semi text-base",
  danger: "text-text-on-primary font-fredoka-bold text-base",
} as const;

type ButtonVariant = keyof typeof buttonVariants;

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  label: string;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
  labelClassName?: string;
}

/**
 * Composant Button réutilisable.
 *
 * @example
 * <Button variant="primary" label="Valider la journée !" onPress={handleValidate} />
 * <Button variant="outline" label="Annuler" loading={isLoading} />
 */
export function Button({
  variant = "primary",
  label,
  loading = false,
  icon,
  className,
  labelClassName,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      accessibilityLabel={props.accessibilityLabel ?? label}
      accessibilityRole={props.accessibilityRole ?? "button"}
      disabled={isDisabled}
      className={cn(buttonVariants[variant], isDisabled && "opacity-50", className)}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" || variant === "danger" ? Colors.white : Colors.primary}
        />
      ) : (
        <>
          {icon && <View>{icon}</View>}
          <Text className={cn(textVariants[variant], labelClassName)}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
