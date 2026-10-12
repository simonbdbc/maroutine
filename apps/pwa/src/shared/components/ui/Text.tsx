import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { cn } from "@shared/utils";

// ─── Variants ────────────────────────────────────────────────────────────────
const variantClasses = {
  h1: "text-4xl font-fredoka-bold text-text-primary",
  h2: "text-3xl font-fredoka-bold text-text-primary",
  h3: "text-2xl font-fredoka-semi text-text-primary",
  h4: "text-xl font-fredoka-semi text-text-primary",
  title: "text-lg font-fredoka-bold text-text-primary",
  body: "text-base font-fredoka text-text-primary",
  label: "text-sm font-fredoka-semi text-text-secondary",
  caption: "text-xs font-fredoka text-text-muted",
  "2xs": "text-2xs font-fredoka-semi text-text-muted uppercase tracking-wider",
} as const;

type TextVariant = keyof typeof variantClasses;

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  className?: string;
  color?: string;
}

/**
 * Composant Text unifié avec la font Fredoka.
 *
 * @example
 * <Text variant="h2">Bonjour Thomas !</Text>
 * <Text variant="label" className="text-primary">Matin</Text>
 */
export function Text({
  variant = "body",
  className,
  style,
  ...props
}: TextProps) {
  return (
    <RNText
      className={cn(variantClasses[variant], className)}
      style={style}
      {...props}
    />
  );
}
