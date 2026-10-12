import { View, TextInput, type TextInputProps } from "react-native";
import { Text } from "./Text";
import { cn } from "@shared/utils";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string | null;
  className?: string;
}

/**
 * Champ de formulaire avec label, input et message d'erreur.
 *
 * @example
 * <FormField
 *   label="Email"
 *   value={email.value}
 *   onChangeText={email.onChange}
 *   onBlur={email.onBlur}
 *   error={email.error}
 *   keyboardType="email-address"
 * />
 */
export function FormField({ label, error, className, ...props }: FormFieldProps) {
  const hasError = Boolean(error);

  return (
    <View className={cn("gap-1.5", className)}>
      <Text variant="label" className="text-text-secondary">
        {label}
      </Text>

      <TextInput
        style={{
          fontFamily: "Fredoka_400Regular",
          fontSize: 16,
          color: Colors.black,
          backgroundColor: hasError ? withAlpha(Colors.error, 0.08) : Colors.white,
          borderWidth: 1.5,
          borderColor: hasError ? Colors.error : Colors.grey,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
        placeholderTextColor={withAlpha(Colors.black, 0.56)}
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
      />

      {hasError && (
        <Text variant="caption" className="text-error ml-1">
          {error}
        </Text>
      )}
    </View>
  );
}
