import { useEffect } from "react";
import {
  View,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { AppIcon, Text, Button, FormField } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import { useProfileBuilder } from "../hooks/useProfileBuilder";
import { ColorPicker } from "./ColorPicker";
import { StickerPicker } from "./StickerPicker";
import { ProfileAvatar } from "./ProfileAvatar";
import type { ChildProfile } from "../types";

interface ProfileBuilderModalProps {
  visible: boolean;
  // null = création, ChildProfile = édition
  profile?: ChildProfile | null;
  onSaved: (profile: ChildProfile) => void;
  onClose: () => void;
}

export function ProfileBuilderModal({
  visible,
  profile,
  onSaved,
  onClose,
}: ProfileBuilderModalProps) {
  const isEdit = Boolean(profile);

  const builder = useProfileBuilder({
    mode: isEdit ? "edit" : "create",
    ...(profile
      ? {
          initial: {
            name: profile.name,
            primaryColor: profile.primaryColor,
            secondaryColor: profile.secondaryColor,
            stickerKey: profile.stickerKey,
          },
          profileId: profile.id,
        }
      : {}),
  });

  // Réinitialiser à chaque ouverture
  useEffect(() => {
    if (visible) builder.reset();
  }, [visible]);

  async function handleSubmit() {
    const saved = await builder.submit();
    if (saved) {
      onSaved(saved);
      onClose();
    }
  }

  const canProceed = builder.draft.name.trim().length >= 2;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: Colors.white }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <View
          className="flex-row items-center justify-between px-5 pb-4 pt-5"
          style={{ borderBottomWidth: 1, borderBottomColor: Colors.grey }}
        >
          <TouchableOpacity
            accessibilityLabel="Fermer"
            accessibilityRole="button"
            onPress={onClose}
            className="h-10 w-10 items-center justify-center"
          >
            <AppIcon name="close" tintColor={Colors.black} />
          </TouchableOpacity>

          <Text variant="title">{isEdit ? "Modifier le profil" : "Nouveau profil"}</Text>

          <View style={{ width: 40, height: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Aperçu avatar ─────────────────────────────────── */}
          <View className="items-center py-2">
            <ProfileAvatar
              stickerKey={builder.draft.stickerKey}
              size={108}
              primaryColor={builder.draft.primaryColor}
              secondaryColor={builder.draft.secondaryColor}
              withBorder
            />
            {builder.draft.name.trim() && (
              <Text variant="h4" className="mt-3" style={{ color: builder.draft.primaryColor }}>
                {builder.draft.name}
              </Text>
            )}
          </View>

          <View className="gap-6">
            <FormField
              label="Prénom de l'enfant"
              value={builder.draft.name}
              onChangeText={builder.setName}
              placeholder="Emma, Théo…"
              autoFocus={!isEdit}
              autoCapitalize="words"
              textContentType="givenName"
              maxLength={20}
            />
            <ColorPicker
              primaryColor={builder.draft.primaryColor}
              secondaryColor={builder.draft.secondaryColor}
              onPrimaryChange={builder.setPrimaryColor}
              onSecondaryChange={builder.setSecondaryColor}
            />
            <StickerPicker
              selected={builder.draft.stickerKey}
              primaryColor={builder.draft.primaryColor}
              label="Avatar"
              onChange={builder.setStickerKey}
            />
          </View>

          {/* ── Erreur globale ───────────────────────────────── */}
          {builder.error && (
            <View
              className="rounded-xl px-4 py-3"
              style={{
                backgroundColor: withAlpha(Colors.error, 0.1),
                borderWidth: 1,
                borderColor: withAlpha(Colors.error, 0.24),
              }}
            >
              <Text variant="caption" className="text-error">
                {builder.error}
              </Text>
            </View>
          )}

          {/* ── CTA ──────────────────────────────────────────── */}
          <Button
            label={isEdit ? "Enregistrer" : "Créer le profil"}
            variant="primary"
            loading={builder.submitting}
            disabled={!canProceed}
            onPress={handleSubmit}
            style={{
              backgroundColor: canProceed ? builder.draft.primaryColor : Colors.grey,
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
