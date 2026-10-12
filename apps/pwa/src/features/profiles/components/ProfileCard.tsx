import { View, TouchableOpacity } from "react-native";
import { AppIcon, Text } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import { ProfileAvatar } from "./ProfileAvatar";
import { getProfileColors, type ChildProfile } from "../types";

interface ProfileCardProps {
  profile: ChildProfile;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProfileCard({ profile, onEdit, onDelete }: ProfileCardProps) {
  const colors = getProfileColors(profile);

  return (
    <View
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: Colors.white,
        shadowColor: colors.primaryBase,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      {/* ── Bande colorée en haut (couleur principale base) ── */}
      <View
        style={{ height: 6, backgroundColor: colors.primaryBase }}
      />

      <View className="px-4 py-4 flex-row items-center gap-3">
        {/* ── Avatar (fond = primary, bordure = secondary) ─── */}
        <ProfileAvatar
          stickerKey={profile.stickerKey}
          size={72}
          primaryColor={colors.primaryBase}
          secondaryColor={colors.secondaryBase}
          withBorder
        />

        {/* ── Infos ─────────────────────────────────────────── */}
        <View className="flex-1 gap-1">
          <Text variant="title" className="text-text-primary">
            {profile.name}
          </Text>

          {/* Badge tirelire — utilise secondaryBase + secondaryPastel */}
          <View className="flex-row items-center gap-1">
            <View
              className="rounded-full px-2.5 py-0.5 flex-row items-center gap-1"
              style={{ backgroundColor: colors.secondaryPastel }}
            >
              <AppIcon name="star" size={12} tintColor={colors.secondaryBase} />
              <Text
                variant="caption"
                style={{ color: colors.secondaryBase, fontFamily: "Fredoka_600SemiBold" }}
              >
                {profile.balance} étoiles
              </Text>
            </View>
          </View>
        </View>

        {/* ── Actions ─────────────────────────────────────── */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={onEdit}
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primaryPastel }}
          >
            <AppIcon name="edit" size={18} tintColor={colors.primaryBase} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: withAlpha(Colors.error, 0.1) }}
          >
            <AppIcon name="trash" size={18} tintColor={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
