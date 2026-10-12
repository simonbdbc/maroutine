import { useState } from "react";
import { View, KeyboardAvoidingView, Platform } from "react-native";
import { Text, Button, FormField } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import { sendPasswordReset, useAuthStore } from "../stores/authStore";
import { useField, validateEmail } from "../hooks/useFormValidation";

interface ForgotPasswordScreenProps {
  onGoBack: () => void;
}

export function ForgotPasswordScreen({ onGoBack }: ForgotPasswordScreenProps) {
  const { status } = useAuthStore();
  const isLoading = status === "loading";
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = useField("", validateEmail);

  async function handleSubmit() {
    email.onBlur();
    if (validateEmail(email.value)) return;

    const result = await sendPasswordReset(email.value);
    if (result.ok) {
      setSent(true);
    } else {
      setError(result.error);
    }
  }

  if (sent) {
    return (
      <View className="flex-1 px-6 pt-8 pb-10 gap-8 justify-center items-center">
        <Text className="text-5xl">📬</Text>
        <View className="gap-2 items-center">
          <Text variant="h4" className="text-center">Email envoyé !</Text>
          <Text variant="label" className="text-text-muted text-center">
            Vérifie ta boîte mail{"\n"}et suis les instructions.
          </Text>
        </View>
        <Button label="Retour à la connexion" variant="outline" onPress={onGoBack} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 px-6 pt-8 pb-10 gap-8">
        <View className="gap-1">
          <Text variant="h3">Mot de passe oublié</Text>
          <Text variant="label" className="text-text-muted">
            On t'envoie un lien de réinitialisation.
          </Text>
        </View>

        <FormField
          label="Ton email"
          value={email.value}
          onChangeText={email.onChange}
          onBlur={email.onBlur}
          error={email.error}
          keyboardType="email-address"
          placeholder="parent@email.com"
          autoComplete="email"
          textContentType="emailAddress"
        />

        {error && (
          <View
            className="rounded-xl px-4 py-3"
            style={{
              backgroundColor: withAlpha(Colors.error, 0.08),
              borderWidth: 1,
              borderColor: withAlpha(Colors.error, 0.35),
            }}
          >
            <Text variant="caption" className="text-error">{error}</Text>
          </View>
        )}

        <Button
          label="Envoyer le lien"
          variant="primary"
          loading={isLoading}
          onPress={handleSubmit}
        />

        <Button
          label="← Retour"
          variant="ghost"
          onPress={onGoBack}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
