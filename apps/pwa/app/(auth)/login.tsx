import { useState, useEffect } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import { useAuthStore } from "@features/auth/stores/authStore";
import { StickerImage } from "@features/stickers";
import { LoginScreen } from "@features/auth/screens/LoginScreen";
import { RegisterScreen } from "@features/auth/screens/RegisterScreen";
import { ForgotPasswordScreen } from "@features/auth/screens/ForgotPasswordScreen";
import { VerifyEmailScreen } from "@features/auth/screens/VerifyEmailScreen";

// ─── Types ────────────────────────────────────────────────────────────────────
type AuthView = "login" | "register" | "forgot" | "verify-email";

export default function AuthPage() {
  const [view, setView] = useState<AuthView>("login");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const { status } = useAuthStore();

  // Redirect dès que la session est confirmée (connexion ou auto-confirm)
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/(app)/home");
    }
    // Inscription OK + confirmation email requise → écran de vérification
    if (status === "pending_verification" && view !== "verify-email") {
      setView("verify-email");
    }
  }, [status]);

  function handleRegistered(email: string) {
    setRegisteredEmail(email);
    setView("verify-email");
  }

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.primary, Colors.primaryPastel]}
      locations={[0, 0.45, 1]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* ── Header logo ──────────────────────────────────────── */}
        <View className="items-center gap-2 pb-6 pt-8">
          <View
            className="h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: withAlpha(Colors.black, 0.18) }}
          >
            <StickerImage stickerKey="star-sticker" size={78} />
          </View>
          <Text
            variant="h2"
            className="text-text-on-primary"
            style={{ fontFamily: "Fredoka_700Bold" }}
          >
            Ma Routine Quotidienne
          </Text>
          {view === "login" && (
            <View className="mt-1 flex-row flex-wrap justify-center gap-2 px-4">
              {[
                { icon: "✅", label: "Activités" },
                { icon: <StickerImage stickerKey="star-sticker" size={13} />, label: "Étoiles" },
                {
                  icon: <StickerImage stickerKey="griffin-sticker" size={16} />,
                  label: "Stickers",
                },
              ].map(({ icon, label }) => (
                <View
                  key={label}
                  className="flex-row items-center gap-1 rounded-full px-3 py-1"
                  style={{ backgroundColor: withAlpha(Colors.black, 0.15) }}
                >
                  {typeof icon === "string" ? (
                    <Text className="text-xs text-text-on-primary">{icon}</Text>
                  ) : (
                    icon
                  )}
                  <Text className="font-fredoka-semi text-xs text-text-on-primary">{label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Card blanche avec le formulaire actif ───────────── */}
        <View
          className="flex-1 overflow-hidden rounded-t-[32px]"
          style={{ backgroundColor: Colors.white }}
        >
          {view === "login" && (
            <LoginScreen
              onGoToRegister={() => setView("register")}
              onGoToForgotPassword={() => setView("forgot")}
            />
          )}
          {view === "register" && (
            <RegisterScreen onGoToLogin={() => setView("login")} onRegistered={handleRegistered} />
          )}
          {view === "forgot" && <ForgotPasswordScreen onGoBack={() => setView("login")} />}
          {view === "verify-email" && (
            <VerifyEmailScreen
              email={registeredEmail}
              onGoToLogin={() => {
                setRegisteredEmail("");
                setView("login");
              }}
            />
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
