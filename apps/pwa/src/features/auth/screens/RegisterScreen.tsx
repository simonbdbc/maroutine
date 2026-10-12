import { View, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { Text, Button, FormField } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import { signUpWithEmail, useAuthStore } from "../stores/authStore";
import {
  useField,
  validateEmail,
  validatePassword,
  validateDisplayName,
} from "../hooks/useFormValidation";

interface RegisterScreenProps {
  onGoToLogin: () => void;
  onRegistered: (email: string) => void;
}

export function RegisterScreen({ onGoToLogin, onRegistered }: RegisterScreenProps) {
  const { status, error: authError } = useAuthStore();
  const isLoading = status === "loading";

  const displayName = useField("", validateDisplayName);
  const email = useField("", validateEmail);
  const password = useField("", validatePassword);

  async function handleSubmit() {
    displayName.onBlur();
    email.onBlur();
    password.onBlur();

    const nameErr = validateDisplayName(displayName.value);
    const emailErr = validateEmail(email.value);
    const passwordErr = validatePassword(password.value);
    if (nameErr || emailErr || passwordErr) return;

    const result = await signUpWithEmail({
      email: email.value,
      password: password.value,
      displayName: displayName.value,
    });

    if (result.ok) {
      // requiresVerification = true → email de confirmation envoyé
      // requiresVerification = false → auto-confirm, onAuthStateChange redirige
      if (result.requiresVerification) {
        onRegistered(email.value);
      }
    }
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
            <Text variant="h3">Créer un compte</Text>
            <Text variant="label" className="text-text-muted">
              Pour toi, le parent 👨‍👩‍👧
            </Text>
          </View>

          {/* ── Formulaire ─────────────────────────────────────── */}
          <View className="gap-4">
            <FormField
              label="Ton prénom"
              value={displayName.value}
              onChangeText={displayName.onChange}
              onBlur={displayName.onBlur}
              error={displayName.error}
              placeholder="Marie"
              autoComplete="name"
              textContentType="givenName"
              autoCapitalize="words"
            />
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
            <FormField
              label="Mot de passe"
              value={password.value}
              onChangeText={password.onChange}
              onBlur={password.onBlur}
              error={password.error}
              secureTextEntry
              placeholder="8 caractères minimum"
              autoComplete="new-password"
              textContentType="newPassword"
            />
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

          {/* ── Mention RGPD ────────────────────────────────────── */}
          <Text variant="caption" className="text-text-muted text-center">
            Tes données restent privées. Aucun tracking, aucune pub.
          </Text>

          {/* ── CTA ────────────────────────────────────────────── */}
          <Button
            label="Créer mon compte"
            variant="primary"
            loading={isLoading}
            onPress={handleSubmit}
          />

          {/* ── Lien connexion ──────────────────────────────────── */}
          <View className="flex-row justify-center gap-1">
            <Text variant="label" className="text-text-muted">
              Déjà un compte ?
            </Text>
            <TouchableOpacity onPress={onGoToLogin}>
              <Text variant="label" className="text-primary">
                Se connecter
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
