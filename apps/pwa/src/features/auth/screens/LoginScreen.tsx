import { View, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { Text, Button, FormField } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import { signInWithEmail, useAuthStore } from "../stores/authStore";
import { useField, validateEmail, validatePassword } from "../hooks/useFormValidation";

interface LoginScreenProps {
  onGoToRegister: () => void;
  onGoToForgotPassword: () => void;
}

export function LoginScreen({ onGoToRegister, onGoToForgotPassword }: LoginScreenProps) {
  const { status, error: authError } = useAuthStore();
  const isLoading = status === "loading";

  const email = useField("", validateEmail);
  const password = useField("", validatePassword);

  async function handleSubmit() {
    // Déclencher la validation sur tous les champs
    email.onBlur();
    password.onBlur();

    const emailErr = validateEmail(email.value);
    const passwordErr = validatePassword(password.value);
    if (emailErr || passwordErr) return;

    await signInWithEmail({
      email: email.value,
      password: password.value,
    });
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 pt-8 pb-10 gap-8">

          {/* ── Titre ──────────────────────────────────────────── */}
          <View className="gap-1">
            <Text variant="h3">Connexion</Text>
            <Text variant="label" className="text-text-muted">
              Content de te revoir ! 👋
            </Text>
          </View>

          {/* ── Formulaire ─────────────────────────────────────── */}
          <View className="gap-4">
            <FormField
              label="Email"
              value={email.value}
              onChangeText={email.onChange}
              onBlur={email.onBlur}
              error={email.error}
              keyboardType="email-address"
              placeholder="parent@email.com"
              autoComplete="email"
              textContentType="emailAddress"
            />

            <View className="gap-1">
              <FormField
                label="Mot de passe"
                value={password.value}
                onChangeText={password.onChange}
                onBlur={password.onBlur}
                error={password.error}
                secureTextEntry
                placeholder="••••••••"
                autoComplete="password"
                textContentType="password"
              />
              <TouchableOpacity
                onPress={onGoToForgotPassword}
                className="self-end"
              >
                <Text variant="caption" className="text-primary">
                  Mot de passe oublié ?
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Erreur globale ──────────────────────────────────── */}
          {authError && (
            <View
              className="rounded-xl px-4 py-3"
              style={{
                backgroundColor: withAlpha(Colors.error, 0.08),
                borderWidth: 1,
                borderColor: withAlpha(Colors.error, 0.35),
              }}
            >
              <Text variant="caption" className="text-error">
                {authError}
              </Text>
            </View>
          )}

          {/* ── CTA ────────────────────────────────────────────── */}
          <Button
            label="Se connecter"
            variant="primary"
            loading={isLoading}
            onPress={handleSubmit}
          />

          {/* ── Lien inscription ────────────────────────────────── */}
          <View className="flex-row justify-center gap-1">
            <Text variant="label" className="text-text-muted">
              Pas encore de compte ?
            </Text>
            <TouchableOpacity onPress={onGoToRegister}>
              <Text variant="label" className="text-primary">
                Créer un compte
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
