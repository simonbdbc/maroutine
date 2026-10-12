import { useCallback, useMemo, useState } from "react";
import { View, ScrollView, TouchableOpacity, Platform, Modal, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { AppIcon, Text, Button, useAppDialog } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import { useProfiles } from "@features/profiles/hooks/useProfiles";
import { ProfileAvatar } from "@features/profiles/components/ProfileAvatar";
import { ProfileBuilderModal } from "@features/profiles/components/ProfileBuilderModal";
import { EmptyProfilesState } from "@features/profiles/components/EmptyProfilesState";
import { getProfileColors, type ChildProfile } from "@features/profiles/types";
import { useAppHeaderControls } from "@navigation/appHeader";
import { resetDayChecks, resetBalance, setBalance } from "@features/settings";
import { copyProfileRoutine } from "@features/catalog";
import { buildHomeRoutinePrintHtml, getRoutineForDate } from "@features/home";
import { getStickerWebUri } from "@features/stickers/registry";

const MAX_PROFILES = 5;
const HEADER_ACTION_SIZE = 34;

function writePrintWindow(printWindow: Window, html: string) {
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

function printWhenReady(printWindow: Window) {
  const startPrint = () => {
    printWindow.focus();
    printWindow.print();
  };

  if (printWindow.document.readyState === "complete") {
    window.setTimeout(startPrint, 100);
  } else {
    printWindow.onload = () => window.setTimeout(startPrint, 100);
  }
}

function resolveAbsoluteStickerWebUri(stickerKey: string): string | null {
  const uri = getStickerWebUri(stickerKey);
  if (!uri) return null;
  if (Platform.OS !== "web") return uri;
  return new URL(uri, window.location.origin).toString();
}

// ─── Action chip ──────────────────────────────────────────────────────────────
function ActionChip({
  label,
  onPress,
  variant = "default",
}: {
  label: string;
  onPress: () => void;
  variant?: "default" | "danger";
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        backgroundColor: variant === "danger" ? withAlpha(Colors.error, 0.08) : Colors.white,
        borderWidth: 1,
        borderColor: variant === "danger" ? withAlpha(Colors.error, 0.35) : Colors.grey,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontFamily: "Fredoka_600SemiBold",
          color: variant === "danger" ? Colors.error : withAlpha(Colors.black, 0.72),
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function CreateProfileChoiceModal({
  visible,
  creatingExample,
  onClose,
  onCreateBlank,
  onCreateExample,
}: {
  visible: boolean;
  creatingExample: boolean;
  onClose: () => void;
  onCreateBlank: () => void;
  onCreateExample: () => void;
}) {
  const disabled = creatingExample;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={disabled ? undefined : onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: withAlpha(Colors.black, 0.45),
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 460,
            backgroundColor: Colors.white,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: Colors.grey,
            padding: 16,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontFamily: "Fredoka_700Bold", color: Colors.black }}>
                Ajouter un enfant
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: withAlpha(Colors.black, 0.64),
                  fontFamily: "Fredoka_600SemiBold",
                }}
              >
                Choisis un départ vierge ou une routine déjà prête.
              </Text>
            </View>
            <TouchableOpacity
              accessibilityLabel="Fermer"
              accessibilityRole="button"
              disabled={disabled}
              onPress={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: withAlpha(Colors.black, 0.05),
              }}
            >
              <AppIcon name="close" size={18} tintColor={Colors.black} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            disabled={disabled}
            onPress={onCreateBlank}
            style={{
              minHeight: 72,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: Colors.grey,
              backgroundColor: Colors.white,
              padding: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: withAlpha(Colors.primary, 0.09),
              }}
            >
              <AppIcon name="plus" size={20} tintColor={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontFamily: "Fredoka_700Bold", color: Colors.black }}>
                Créer un profil enfant
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: withAlpha(Colors.black, 0.64),
                  fontFamily: "Fredoka_600SemiBold",
                }}
              >
                Ouvre le formulaire actuel avec une routine vide.
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={disabled}
            onPress={onCreateExample}
            style={{
              minHeight: 72,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: withAlpha(Colors.primary, 0.32),
              backgroundColor: withAlpha(Colors.primary, 0.07),
              padding: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              opacity: disabled ? 0.7 : 1,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: Colors.white,
              }}
            >
              <AppIcon name="star" size={20} tintColor={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontFamily: "Fredoka_700Bold", color: Colors.black }}>
                Utiliser un profil exemple à modifier
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: withAlpha(Colors.black, 0.64),
                  fontFamily: "Fredoka_600SemiBold",
                }}
              >
                {creatingExample
                  ? "Création du profil exemple…"
                  : "Ajoute Exemple avec une routine et des récompenses préconfigurées."}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Profile row ──────────────────────────────────────────────────────────────
function ProfileRow({
  profile,
  onEdit,
  onDelete,
  onResetBalance,
  onResetDay,
  onConfigureRoutine,
  onManageRewards,
  onSetBalance,
  onCopyRoutine,
  onPrintRoutine,
  printingRoutine = false,
}: {
  profile: ChildProfile;
  onEdit: () => void;
  onDelete: () => void;
  onResetBalance: () => void;
  onResetDay: () => void;
  onConfigureRoutine: () => void;
  onManageRewards: () => void;
  onSetBalance: () => void;
  onCopyRoutine?: () => void;
  onPrintRoutine: () => void;
  printingRoutine?: boolean;
}) {
  const colors = getProfileColors(profile);

  return (
    <View
      style={{
        borderRadius: 16,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.grey,
        overflow: "hidden",
      }}
    >
      <View style={{ height: 4, backgroundColor: colors.primaryBase }} />
      <View style={{ padding: 12, gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <ProfileAvatar
            stickerKey={profile.stickerKey}
            size={44}
            primaryColor={colors.primaryBase}
            secondaryColor={colors.secondaryBase}
            withBorder
          />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 15, color: Colors.black }}>
              {profile.name}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <AppIcon name="star" size={11} tintColor={colors.secondaryBase} />
              <Text
                style={{
                  fontSize: 12,
                  color: withAlpha(Colors.black, 0.72),
                  fontFamily: "Fredoka_600SemiBold",
                }}
              >
                {profile.balance} étoiles
              </Text>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
          <ActionChip label="✏️ Modifier le profil enfant" onPress={onEdit} />
          <ActionChip label="📋 Gestion de la Routine" onPress={onConfigureRoutine} />
          <ActionChip label="🎁 Gestion des Récompenses" onPress={onManageRewards} />
          {onCopyRoutine ? (
            <ActionChip label="Copier vers un autre profil" onPress={onCopyRoutine} />
          ) : null}
          <ActionChip
            label={printingRoutine ? "Génération en cours PDF…" : "Générer un PDF"}
            onPress={onPrintRoutine}
          />
          <ActionChip label="💰 Modifier la tirelire" onPress={onSetBalance} />
          <ActionChip label="🔄 Reset de la journée" onPress={onResetDay} />
          <ActionChip label="⭐ Reset des étoiles" onPress={onResetBalance} />
          <ActionChip label="🗑️ Supprimer le profil enfant" onPress={onDelete} variant="danger" />
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProfilesScreen() {
  const { profiles, loading, error, refresh, remove, createExample } = useProfiles();
  const appDialog = useAppDialog();
  const [modalVisible, setModalVisible] = useState(false);
  const [createChoiceVisible, setCreateChoiceVisible] = useState(false);
  const [creatingExample, setCreatingExample] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ChildProfile | null>(null);
  const [balanceModalProfile, setBalanceModalProfile] = useState<ChildProfile | null>(null);
  const [balanceDraft, setBalanceDraft] = useState("");
  const [copyModalVisible, setCopyModalVisible] = useState(false);
  const [copySourceProfile, setCopySourceProfile] = useState<ChildProfile | null>(null);
  const [copyingTargetId, setCopyingTargetId] = useState<string | null>(null);
  const [printingProfileId, setPrintingProfileId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const handleAdd = useCallback(() => {
    if (profiles.length >= MAX_PROFILES) {
      appDialog.showError(`Tu peux avoir jusqu'à ${MAX_PROFILES} profils.`, "Limite atteinte");
      return;
    }
    setEditingProfile(null);
    setCreateChoiceVisible(true);
  }, [appDialog.showError, profiles.length]);

  const headerRight = useMemo(
    () =>
      profiles.length < MAX_PROFILES ? (
        <TouchableOpacity
          accessibilityLabel="Ajouter un enfant"
          accessibilityRole="button"
          onPress={handleAdd}
          style={{
            width: HEADER_ACTION_SIZE,
            height: HEADER_ACTION_SIZE,
            borderRadius: HEADER_ACTION_SIZE / 2,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: withAlpha(Colors.primary, 0.09),
            borderWidth: 1,
            borderColor: withAlpha(Colors.primary, 0.25),
          }}
        >
          <AppIcon name="plus" />
        </TouchableOpacity>
      ) : null,
    [handleAdd, profiles.length]
  );

  useAppHeaderControls({ right: headerRight });

  function handleEdit(profile: ChildProfile) {
    setEditingProfile(profile);
    setModalVisible(true);
  }

  function handleCreateBlankProfile() {
    setCreateChoiceVisible(false);
    setEditingProfile(null);
    setModalVisible(true);
  }

  async function handleCreateExampleProfile() {
    if (creatingExample) return;
    if (profiles.length >= MAX_PROFILES) {
      appDialog.showError(`Tu peux avoir jusqu'à ${MAX_PROFILES} profils.`, "Limite atteinte");
      return;
    }

    setCreatingExample(true);
    try {
      const created = await createExample();
      setCreateChoiceVisible(false);
      await refresh();
      appDialog.showSuccess(
        "Profil exemple créé",
        `${created.name} est prêt à être modifié.`
      );
    } catch (err) {
      appDialog.showError(
        err instanceof Error ? err.message : "Impossible de créer le profil exemple."
      );
    } finally {
      setCreatingExample(false);
    }
  }

  function handleDelete(profile: ChildProfile) {
    appDialog.confirmDialog({
      title: `Supprimer "${profile.name}" ?`,
      message: "Toutes les données de ce profil seront supprimées définitivement.",
      confirmLabel: "Supprimer",
      variant: "danger",
      onConfirm: () => void remove(profile.id).then(refresh),
    });
  }

  function handleResetBalance(profile: ChildProfile) {
    appDialog.confirmDialog({
      title: `Reset les étoiles de ${profile.name} ?`,
      message: `La tirelire de ${profile.balance} étoiles sera remise à zéro.`,
      confirmLabel: "Reset",
      variant: "danger",
      onConfirm: () => {
        void resetBalance(profile.id)
          .then(refresh)
          .catch((err: unknown) =>
            appDialog.showError(
              err instanceof Error ? err.message : "Impossible de reset la tirelire."
            )
          );
      },
    });
  }

  function handleResetDay(profile: ChildProfile) {
    appDialog.confirmDialog({
      title: `Reset la journée de ${profile.name} ?`,
      message:
        "Toutes les tâches cochées aujourd'hui seront décochées et la validation du jour sera retirée.",
      confirmLabel: "Reset",
      variant: "danger",
      onConfirm: () => {
        void resetDayChecks(profile.id)
          .then(refresh)
          .catch((err: unknown) =>
            appDialog.showError(
              err instanceof Error ? err.message : "Impossible de reset la journée."
            )
          );
      },
    });
  }

  function openSetBalanceModal(profile: ChildProfile) {
    setBalanceModalProfile(profile);
    setBalanceDraft(String(profile.balance));
  }

  function closeSetBalanceModal() {
    setBalanceModalProfile(null);
    setBalanceDraft("");
  }

  function openCopyRoutineModal(profile: ChildProfile) {
    if (profiles.length < 2) {
      appDialog.showError("Ajoute au moins deux profils pour copier une routine.");
      return;
    }

    setCopySourceProfile(profile);
    setCopyModalVisible(true);
  }

  function closeCopyRoutineModal() {
    if (copyingTargetId) return;
    setCopyModalVisible(false);
  }

  async function performCopyRoutine(source: ChildProfile, target: ChildProfile) {
    setCopyingTargetId(target.id);
    try {
      await copyProfileRoutine(source.id, target.id);
      setCopyModalVisible(false);
      await refresh();
      appDialog.showSuccess(
        "Routine copiée",
        `La routine de ${source.name} a été copiée vers ${target.name}.`
      );
    } catch (err) {
      appDialog.showError(err instanceof Error ? err.message : "Impossible de copier la routine.");
    } finally {
      setCopyingTargetId(null);
    }
  }

  function handleCopyRoutineTarget(target: ChildProfile) {
    if (!copySourceProfile) return;
    const source = copySourceProfile;

    appDialog.confirmDialog({
      title: `Copier vers ${target.name} ?`,
      message: `La routine actuelle de ${target.name} sera remplacée par celle de ${source.name}.`,
      confirmLabel: "Remplacer",
      variant: "danger",
      onConfirm: () => void performCopyRoutine(source, target),
    });
  }

  function parseBalanceDraft(value: string): number | null {
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;
    if (!/^\d+$/.test(trimmed)) return null;
    const nextValue = Number.parseInt(trimmed, 10);
    if (!Number.isInteger(nextValue) || nextValue < 0) return null;
    return nextValue;
  }

  function handleSubmitBalance() {
    if (!balanceModalProfile) return;
    const nextBalance = parseBalanceDraft(balanceDraft);
    if (nextBalance == null) {
      appDialog.showError("Entre un montant entier supérieur ou égal à 0.");
      return;
    }

    void setBalance(balanceModalProfile.id, nextBalance)
      .then(() => {
        closeSetBalanceModal();
        return refresh();
      })
      .catch((err: unknown) =>
        appDialog.showError(
          err instanceof Error ? err.message : "Impossible de modifier la tirelire."
        )
      );
  }

  function handleConfigureRoutine(profile: ChildProfile) {
    router.push({
      pathname: "/(app)/profiles/builder",
      params: {
        profileId: profile.id,
        profileName: profile.name,
        primaryColor: profile.primaryColor,
      },
    });
  }

  function handleManageRewards(profile: ChildProfile) {
    router.push({
      pathname: "/(app)/profiles/rewards" as never,
      params: {
        profileId: profile.id,
        profileName: profile.name,
        primaryColor: profile.primaryColor,
      },
    });
  }

  async function handlePrintHomeRoutine(profile: ChildProfile) {
    if (printingProfileId) return;

    if (Platform.OS !== "web") {
      appDialog.showError("L'export PDF est disponible depuis la version web.", "Export PDF");
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=1000");
    if (!printWindow) {
      appDialog.showError(
        "Impossible d'ouvrir la fenêtre d'impression. Autorise les pop-ups puis réessaie."
      );
      return;
    }

    writePrintWindow(
      printWindow,
      '<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Préparation PDF</title></head><body><p>Préparation du PDF…</p></body></html>'
    );

    setPrintingProfileId(profile.id);
    try {
      const routine = await getRoutineForDate(profile.id);
      const html = buildHomeRoutinePrintHtml({
        routine,
        profile,
        getStickerWebUri: resolveAbsoluteStickerWebUri,
      });
      writePrintWindow(printWindow, html);
      printWhenReady(printWindow);
    } catch (err) {
      printWindow.close();
      appDialog.showError(err instanceof Error ? err.message : "Impossible de préparer le PDF.");
    } finally {
      setPrintingProfileId(null);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }} edges={["top"]}>
      <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
        <Text variant="caption" style={{ color: withAlpha(Colors.black, 0.56) }}>
          {profiles.length}/{MAX_PROFILES} profil{profiles.length > 1 ? "s" : ""}
        </Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 40 }}>⏳</Text>
          <Text style={{ color: withAlpha(Colors.black, 0.56), marginTop: 8 }}>Chargement…</Text>
        </View>
      ) : error ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 40 }}>⚠️</Text>
          <Text style={{ color: Colors.error, textAlign: "center" }}>{error}</Text>
          <Button label="Réessayer" variant="outline" onPress={refresh} />
        </View>
      ) : profiles.length === 0 ? (
        <EmptyProfilesState />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {profiles.map((profile) => (
            <ProfileRow
              key={profile.id}
              profile={profile}
              onEdit={() => handleEdit(profile)}
              onDelete={() => handleDelete(profile)}
              onResetBalance={() => handleResetBalance(profile)}
              onResetDay={() => handleResetDay(profile)}
              onConfigureRoutine={() => handleConfigureRoutine(profile)}
              onManageRewards={() => handleManageRewards(profile)}
              onSetBalance={() => openSetBalanceModal(profile)}
              onPrintRoutine={() => void handlePrintHomeRoutine(profile)}
              printingRoutine={printingProfileId === profile.id}
              {...(profiles.length > 1
                ? { onCopyRoutine: () => openCopyRoutineModal(profile) }
                : {})}
            />
          ))}
        </ScrollView>
      )}

      <CreateProfileChoiceModal
        visible={createChoiceVisible}
        creatingExample={creatingExample}
        onClose={() => setCreateChoiceVisible(false)}
        onCreateBlank={handleCreateBlankProfile}
        onCreateExample={() => void handleCreateExampleProfile()}
      />

      <ProfileBuilderModal
        visible={modalVisible}
        profile={editingProfile}
        onSaved={() => void refresh()}
        onClose={() => setModalVisible(false)}
      />

      <Modal
        visible={copyModalVisible}
        animationType="fade"
        transparent
        onRequestClose={closeCopyRoutineModal}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: withAlpha(Colors.black, 0.45),
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 460,
              backgroundColor: Colors.white,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: Colors.grey,
              padding: 16,
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 17, fontFamily: "Fredoka_700Bold", color: Colors.black }}>
              Copier la routine
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: withAlpha(Colors.black, 0.72),
                fontFamily: "Fredoka_600SemiBold",
              }}
            >
              {copySourceProfile
                ? `Copier la routine de "${copySourceProfile.name}" vers un autre profil enfant.`
                : ""}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: withAlpha(Colors.black, 0.72),
                fontFamily: "Fredoka_600SemiBold",
              }}
            >
              Choisis le profil à remplacer.
            </Text>

            <View style={{ gap: 8 }}>
              {(copySourceProfile
                ? profiles.filter((profile) => profile.id !== copySourceProfile.id)
                : []
              ).map((profile) => {
                const colors = getProfileColors(profile);
                const copying = copyingTargetId === profile.id;
                return (
                  <TouchableOpacity
                    key={profile.id}
                    disabled={copyingTargetId !== null}
                    onPress={() => handleCopyRoutineTarget(profile)}
                    style={{
                      minHeight: 48,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: copying ? colors.primaryBase : Colors.grey,
                      backgroundColor: copying ? withAlpha(colors.primaryBase, 0.08) : Colors.white,
                      paddingHorizontal: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <ProfileAvatar
                      stickerKey={profile.stickerKey}
                      size={32}
                      primaryColor={colors.primaryBase}
                      secondaryColor={colors.secondaryBase}
                      withBorder
                    />
                    <Text
                      numberOfLines={1}
                      style={{
                        flex: 1,
                        fontFamily: "Fredoka_700Bold",
                        fontSize: 14,
                        color: Colors.black,
                      }}
                    >
                      {profile.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: "Fredoka_600SemiBold",
                        color: withAlpha(Colors.black, 0.56),
                      }}
                    >
                      {copying ? "Copie…" : "Remplacer"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              disabled={copyingTargetId !== null}
              onPress={closeCopyRoutineModal}
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: Colors.grey,
                alignItems: "center",
                justifyContent: "center",
                height: 42,
                backgroundColor: Colors.white,
                opacity: copyingTargetId !== null ? 0.56 : 1,
              }}
            >
              <Text
                style={{
                  color: withAlpha(Colors.black, 0.72),
                  fontFamily: "Fredoka_700Bold",
                  fontSize: 13,
                }}
              >
                Annuler
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={balanceModalProfile !== null}
        animationType="fade"
        transparent
        onRequestClose={closeSetBalanceModal}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: withAlpha(Colors.black, 0.45),
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 420,
              backgroundColor: Colors.white,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: Colors.grey,
              padding: 16,
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 17, fontFamily: "Fredoka_700Bold", color: Colors.black }}>
              Modifier la tirelire
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: withAlpha(Colors.black, 0.72),
                fontFamily: "Fredoka_600SemiBold",
              }}
            >
              {balanceModalProfile
                ? `${balanceModalProfile.name} — indique un montant d'étoiles (entier >= 0).`
                : ""}
            </Text>
            <TextInput
              value={balanceDraft}
              onChangeText={setBalanceDraft}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={withAlpha(Colors.black, 0.56)}
              autoFocus
              onSubmitEditing={handleSubmitBalance}
              style={{
                height: 44,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: Colors.grey,
                paddingHorizontal: 12,
                fontSize: 16,
                color: Colors.black,
                fontFamily: "Fredoka_600SemiBold",
              }}
            />

            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={closeSetBalanceModal}
                style={{
                  flex: 1,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: Colors.grey,
                  alignItems: "center",
                  justifyContent: "center",
                  height: 42,
                  backgroundColor: Colors.white,
                }}
              >
                <Text
                  style={{
                    color: withAlpha(Colors.black, 0.72),
                    fontFamily: "Fredoka_700Bold",
                    fontSize: 13,
                  }}
                >
                  Annuler
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmitBalance}
                style={{
                  flex: 1,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  height: 42,
                  backgroundColor: Colors.primary,
                }}
              >
                <Text style={{ color: Colors.white, fontFamily: "Fredoka_700Bold", fontSize: 13 }}>
                  Appliquer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {appDialog.dialog}
    </SafeAreaView>
  );
}
