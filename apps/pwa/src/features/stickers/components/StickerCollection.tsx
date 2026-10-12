import { View } from "react-native";
import { Text } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import { STICKER_KEYS, STICKER_COUNT, getStickerLabel } from "@features/stickers/registry";
import { StickerImage } from "./StickerImage";

interface StickerCollectionProps {
  /** Set des sticker keys uniques gagnés par l'enfant */
  earnedKeys: Set<string>;
  /** Couleur pour le badge de comptage */
  accentColor?: string;
}

/**
 * Grille "Ma collection" — affiche tous les stickers possibles,
 * ceux gagnés sont en couleur, les autres en grisé.
 * Stat : "Tu as X stickers différents sur Y possibles"
 */
export function StickerCollection({
  earnedKeys,
  accentColor = Colors.secondary,
}: StickerCollectionProps) {
  const earnedCount = earnedKeys.size;

  return (
    <View className="gap-4">
      {/* ── Stats ─────────────────────────────────────────── */}
      <View className="flex-row items-center gap-2">
        <View
          className="rounded-full px-3 py-1.5"
          style={{ backgroundColor: withAlpha(accentColor, 0.188) }}
        >
          <Text
            style={{
              fontSize: 13,
              fontFamily: "Fredoka_700Bold",
              color: accentColor,
            }}
          >
            {earnedCount} / {STICKER_COUNT} stickers
          </Text>
        </View>
        <Text style={{ fontSize: 12, color: withAlpha(Colors.black, 0.56) }}>
          {earnedCount === STICKER_COUNT
            ? "Collection complète !"
            : earnedCount === 0
            ? "Aucun sticker gagné"
            : "Continue comme ça !"}
        </Text>
      </View>

      {/* ── Grille ────────────────────────────────────────── */}
      <View className="flex-row flex-wrap gap-3">
        {STICKER_KEYS.map((key) => {
          const isEarned = earnedKeys.has(key);
          return (
            <View
              key={key}
              style={{
                width: 64,
                height: 72,
                alignItems: "center",
                gap: 2,
                opacity: isEarned ? 1 : 0.25,
              }}
              accessibilityLabel={`${getStickerLabel(key)}${isEarned ? " — gagné" : " — pas encore gagné"}`}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  backgroundColor: isEarned ? Colors.white : Colors.white,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: isEarned ? 2 : 1,
                  borderColor: isEarned ? accentColor : Colors.grey,
                  shadowColor: isEarned ? accentColor : "transparent",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isEarned ? 0.3 : 0,
                  shadowRadius: 6,
                  elevation: isEarned ? 3 : 0,
                  overflow: "hidden",
                }}
              >
                <StickerImage stickerKey={key} size={40} />
              </View>
              <Text
                style={{
                  fontSize: 9,
                  color: isEarned ? withAlpha(Colors.black, 0.72) : withAlpha(Colors.black, 0.56),
                  fontFamily: "Fredoka_600SemiBold",
                  textAlign: "center",
                }}
                numberOfLines={1}
              >
                {getStickerLabel(key)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
