import { View } from "react-native";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import { StickerImage } from "@features/stickers/components/StickerImage";

interface ProfileAvatarProps {
  stickerKey: string;
  size?: number;
  /** Couleur de fond du cercle (primaryColor du profil) */
  primaryColor?: string;
  /** Couleur de la bordure (secondaryColor du profil) */
  secondaryColor?: string;
  withBorder?: boolean;
  /** Override explicite de la couleur de bordure */
  borderColor?: string;
}

/**
 * Avatar d'un profil enfant.
 * EPIC 6 : affiche la vraie image sticker au lieu d'un emoji.
 *
 * Couleurs :
 * - Fond = primaryColor (avec opacité)
 * - Bordure = secondaryColor (ou borderColor si override)
 */
export function ProfileAvatar({
  stickerKey,
  size = 56,
  primaryColor = Colors.primary,
  secondaryColor = Colors.secondary,
  withBorder = false,
  borderColor,
}: ProfileAvatarProps) {
  const borderWidth = withBorder ? Math.max(2, Math.round(size * 0.06)) : 0;
  const innerInset = withBorder ? Math.max(1, Math.round(size * 0.04)) : 0;
  const imageSize = Math.max(16, size - (borderWidth + innerInset) * 2);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: withAlpha(primaryColor, 0.13),
        alignItems: "center",
        justifyContent: "center",
        borderWidth,
        borderColor: borderColor ?? secondaryColor,
        padding: innerInset,
        overflow: "hidden",
      }}
    >
      <StickerImage stickerKey={stickerKey} size={imageSize} />
    </View>
  );
}
