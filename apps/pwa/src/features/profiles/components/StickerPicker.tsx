import { View, TouchableOpacity } from "react-native";
import { Text } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import { STICKER_KEYS, getStickerLabel } from "@features/stickers/registry";
import { StickerImage } from "@features/stickers/components/StickerImage";

interface StickerPickerProps {
  selected: string;
  primaryColor?: string;
  label?: string;
  onChange: (key: string) => void;
}

/**
 * Grille de sélection d'un sticker (dans le ProfileBuilder).
 * EPIC 6 : affiche les vraies images sticker au lieu d'emojis.
 */
export function StickerPicker({
  selected,
  primaryColor = Colors.primary,
  label = "Animal préféré",
  onChange,
}: StickerPickerProps) {
  const imageSize = 70;

  return (
    <View className="gap-2">
      <Text variant="label" className="text-text-secondary">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {STICKER_KEYS.map((key) => {
          const isSelected = key === selected;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => onChange(key)}
              accessibilityLabel={getStickerLabel(key)}
              style={{
                width: imageSize,
                height: imageSize,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isSelected
                  ? withAlpha(primaryColor, 0.13)
                  : Colors.white,
                borderWidth: isSelected ? 2.5 : 1.5,
                borderColor: isSelected ? primaryColor : Colors.grey,
                overflow: "hidden",
              }}
            >
              <StickerImage stickerKey={key} size={imageSize} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
