import { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  Switch,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Card, Text, useAppDialog } from "@shared/components/ui";
import { APP_VERSION } from "@shared/pwa";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import { sendPasswordReset, signOut, useAuthStore, UserAvatar } from "@features/auth";
import {
  FIXED_SIDE_MENU_MIN_WIDTH,
  canUseFixedSideMenuByContext,
  useLayoutPreferences,
} from "@features/preferences";

function SectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <Text
      style={{
        color: withAlpha(Colors.black, 0.56),
        textTransform: "uppercase",
        letterSpacing: 1.2,
        fontSize: 11,
        fontFamily: "Fredoka_600SemiBold",
        marginBottom: 4,
      }}
    >
      {icon} {label}
    </Text>
  );
}

function PreferenceSwitchRow({
  title,
  description,
  value,
  disabled,
  onValueChange,
}: {
  title: string;
  description: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (enabled: boolean) => void;
}) {
  return (
    <View
      style={{
        minHeight: 56,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        paddingVertical: 8,
      }}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text style={{ fontFamily: "Fredoka_700Bold", color: Colors.black, fontSize: 14 }}>
          {title}
        </Text>
        <Text style={{ color: withAlpha(Colors.black, 0.56), fontSize: 12, lineHeight: 17 }}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{
          false: Colors.grey,
          true: withAlpha(Colors.primary, 0.45),
        }}
        thumbColor={value ? Colors.primary : Colors.white}
      />
    </View>
  );
}

export default function AccountScreen() {
  const { user } = useAuthStore();
  const appDialog = useAppDialog();
  const { width: viewportWidth } = useWindowDimensions();
  const {
    preferences,
    error: preferencesError,
    setRoutineDisplayMode,
    setSideMenuMode,
    setRoutineLayoutMode,
  } = useLayoutPreferences();
  const [resetPasswordSent, setResetPasswordSent] = useState(false);
  const layoutViewportContext = useMemo(
    () => ({
      platform: Platform.OS === "web" ? ("web" as const) : ("native" as const),
      userAgent: (globalThis as { navigator?: { userAgent?: string } }).navigator?.userAgent ?? "",
    }),
    []
  );
  const canUseFixedSidebar = canUseFixedSideMenuByContext({
    width: viewportWidth,
    context: layoutViewportContext,
    desktopBreakpoint: FIXED_SIDE_MENU_MIN_WIDTH,
  });
  const fixedSidebarEnabled = canUseFixedSidebar && preferences.sideMenuMode === "fixed";

  async function doSignOut() {
    try {
      await signOut();
    } catch {
      // La redirection force la sortie même si Supabase a déjà invalidé la session.
    }
    router.replace("/(auth)/login");
  }

  function handleSignOut() {
    appDialog.confirmDialog({
      title: "Se déconnecter ?",
      message: "Tu devras entrer ton email et mot de passe pour revenir.",
      confirmLabel: "Se déconnecter",
      variant: "danger",
      onConfirm: () => void doSignOut(),
    });
  }

  async function handlePasswordReset() {
    if (!user?.email) return;
    try {
      await sendPasswordReset(user.email);
      setResetPasswordSent(true);
    } catch {
      // Le bouton reste disponible si l'envoi échoue silencieusement.
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 60,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Card className="gap-4 p-4">
          <SectionHeader icon="👤" label="Compte" />
          <View className="flex-row items-center gap-3">
            <UserAvatar user={user} size={48} />
            <View className="flex-1">
              <Text variant="title">{user?.displayName ?? "Utilisateur"}</Text>
              <Text variant="caption">{user?.email ?? ""}</Text>
            </View>
          </View>
          {user?.email ? (
            <TouchableOpacity
              onPress={handlePasswordReset}
              disabled={resetPasswordSent}
              style={{
                backgroundColor: Colors.white,
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: Colors.grey,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: "Fredoka_600SemiBold",
                  color: resetPasswordSent ? Colors.success : Colors.primary,
                  textAlign: "center",
                }}
              >
                {resetPasswordSent
                  ? "✓ Email de réinitialisation envoyé"
                  : "Changer de mot de passe"}
              </Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            onPress={handleSignOut}
            style={{
              backgroundColor: withAlpha(Colors.error, 0.08),
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: withAlpha(Colors.error, 0.35),
            }}
          >
            <Text
              style={{
                color: Colors.error,
                fontFamily: "Fredoka_600SemiBold",
                fontSize: 13,
                textAlign: "center",
              }}
            >
              Se déconnecter
            </Text>
          </TouchableOpacity>
        </Card>

        <Card className="gap-2 p-4">
          <SectionHeader icon="🖥️" label="Options" />
          <PreferenceSwitchRow
            title="Menu ancré"
            description={
              canUseFixedSidebar
                ? "Garde le menu ouvert sur les grands écrans."
                : "Le menu fixe est désactivé sur ce format d'écran."
            }
            value={fixedSidebarEnabled}
            disabled={!canUseFixedSidebar}
            onValueChange={(enabled) => {
              void setSideMenuMode(enabled ? "fixed" : "overlay");
            }}
          />
          <PreferenceSwitchRow
            title="Affichage multi routines"
            description="Sur grand écran, affiche automatiquement plusieurs routines selon la place disponible."
            value={preferences.routineLayoutMode === "auto"}
            onValueChange={(enabled) => {
              void setRoutineLayoutMode(enabled ? "auto" : "single");
            }}
          />
          <PreferenceSwitchRow
            title="Affichage adapté"
            description="Affiche les routines avec les espacements et tailles plus confortables sur grand écran."
            value={preferences.routineDisplayMode === "adapted"}
            onValueChange={(enabled) => {
              void setRoutineDisplayMode(enabled ? "adapted" : "regular");
            }}
          />
          {preferencesError ? (
            <Text style={{ fontSize: 12, color: Colors.error }}>{preferencesError}</Text>
          ) : null}
        </Card>

        <Card className="gap-2 p-4">
          <SectionHeader icon="ℹ️" label="À propos" />
          <Text style={{ fontSize: 12, color: withAlpha(Colors.black, 0.56) }}>
            Maroutine v{APP_VERSION}
          </Text>
          <TouchableOpacity
            accessibilityLabel="Tableau de bord PWA"
            accessibilityRole="button"
            onPress={() => router.push("/(app)/pwa" as never)}
            style={{
              backgroundColor: Colors.white,
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: Colors.grey,
            }}
          >
            <Text
              style={{
                color: Colors.primary,
                fontFamily: "Fredoka_600SemiBold",
                fontSize: 13,
                textAlign: "center",
              }}
            >
              Tableau de bord PWA
            </Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
      {appDialog.dialog}
    </SafeAreaView>
  );
}
