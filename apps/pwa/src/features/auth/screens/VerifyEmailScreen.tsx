import { useState } from "react";
import { View } from "react-native";
import { Text, Button } from "@shared/components/ui";
import { supabase } from "@shared/db";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import { toFrenchAuthError } from "../types";

interface VerifyEmailScreenProps {
  email: string;
  onGoToLogin: () => void;
}

export function VerifyEmailScreen({ email, onGoToLogin }: VerifyEmailScreenProps) {
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  async function handleResend() {
    setResending(true);
    setResendError(null);
    setResendSuccess(false);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    setResending(false);
    if (error) {
      setResendError(toFrenchAuthError(error.message));
    } else {
      setResendSuccess(true);
    }
  }

  return (
    <View className="flex-1 px-6 pt-8 pb-10 gap-8 justify-center items-center">

      {/* ── Icône ──────────────────────────────────────────────── */}
      <View
        className="w-24 h-24 rounded-full items-center justify-center"
        style={{ backgroundColor: Colors.primaryPastel }}
      >
        <Text style={{ fontSize: 48 }}>📬</Text>
      </View>

      {/* ── Message principal ────────────────────────────────── */}
      <View className="gap-3 items-center">
        <Text variant="h3" className="text-center">
          Vérifie ta boîte mail
        </Text>
        <Text variant="body" className="text-text-muted text-center leading-relaxed">
          Un email de confirmation a été envoyé à{"\n"}
          <Text variant="body" className="text-primary font-fredoka-semi">
            {email}
          </Text>
        </Text>
        <Text variant="label" className="text-text-muted text-center">
          Clique sur le lien dans l'email pour activer ton compte, puis reviens ici te connecter.
        </Text>
      </View>

      {/* ── Feedback renvoi ──────────────────────────────────── */}
      {resendSuccess && (
        <View
          className="rounded-xl px-4 py-3 w-full"
          style={{
            backgroundColor: withAlpha(Colors.success, 0.12),
            borderWidth: 1,
            borderColor: withAlpha(Colors.success, 0.35),
          }}
        >
          <Text variant="caption" className="text-center" style={{ color: Colors.success }}>
            ✓ Email renvoyé ! Vérifie aussi tes spams.
          </Text>
        </View>
      )}
      {resendError && (
        <View
          className="rounded-xl px-4 py-3 w-full"
          style={{
            backgroundColor: withAlpha(Colors.error, 0.08),
            borderWidth: 1,
            borderColor: withAlpha(Colors.error, 0.35),
          }}
        >
          <Text variant="caption" className="text-error text-center">
            {resendError}
          </Text>
        </View>
      )}

      {/* ── CTAs ─────────────────────────────────────────────── */}
      <View className="gap-3 w-full">
        <Button
          label="Aller se connecter"
          variant="primary"
          onPress={onGoToLogin}
        />
        <Button
          label={resending ? "Envoi en cours…" : "Renvoyer l'email"}
          variant="ghost"
          loading={resending}
          onPress={handleResend}
        />
      </View>

      {/* ── Aide spam ────────────────────────────────────────── */}
      <Text variant="caption" className="text-text-muted text-center">
        L'email n'arrive pas ? Vérifie tes spams{"\n"}ou contacte le support.
      </Text>
    </View>
  );
}
