import { View, TouchableOpacity } from "react-native";
import { Text } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { PRIMARY_COLORS, SECONDARY_COLORS } from "../types";
import { hexToPastel, withAlpha } from "@shared/utils/colorUtils";

// ─── Palette row réutilisable ─────────────────────────────────────────────────
function PaletteRow({
  colors,
  selected,
  onChange,
}: {
  colors: string[];
  selected: string;
  onChange: (color: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {colors.map((color) => {
        const isSelected = color === selected;
        return (
          <TouchableOpacity
            key={color}
            onPress={() => onChange(color)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: color,
              borderWidth: isSelected ? 3 : 0,
              borderColor: Colors.black,
              shadowColor: color,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isSelected ? 0.7 : 0,
              shadowRadius: 6,
              elevation: isSelected ? 4 : 0,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isSelected && (
              <Text style={{ color: Colors.black, fontSize: 20, fontWeight: "bold" }}>✓</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Aperçu des 4 couleurs résolues ──────────────────────────────────────────
function ColorPreview({
  primaryColor,
  secondaryColor,
}: {
  primaryColor: string;
  secondaryColor: string;
}) {
  const pp = hexToPastel(primaryColor, 0.75);
  const sp = hexToPastel(secondaryColor, 0.75);

  const swatches = [
    { color: primaryColor, label: "Base" },
    { color: pp, label: "Pastel" },
    { color: secondaryColor, label: "Base" },
    { color: sp, label: "Pastel" },
  ];

  return (
    <View className="flex-row items-center justify-center gap-2 py-2">
      {swatches.map(({ color, label }, i) => (
        <View key={`${color}-${i}`} className="items-center gap-1">
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: color,
              borderWidth: 1,
              borderColor: withAlpha(Colors.black, 0.08),
            }}
          />
          <Text style={{ fontSize: 9, color: withAlpha(Colors.black, 0.56) }}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Export principal ─────────────────────────────────────────────────────────
interface ColorPickerProps {
  primaryColor: string;
  secondaryColor: string;
  onPrimaryChange: (color: string) => void;
  onSecondaryChange: (color: string) => void;
}

export function ColorPicker({
  primaryColor,
  secondaryColor,
  onPrimaryChange,
  onSecondaryChange,
}: ColorPickerProps) {
  return (
    <View className="gap-5">
      {/* ── Aperçu résultat ──────────────────────────────── */}
      <ColorPreview primaryColor={primaryColor} secondaryColor={secondaryColor} />

      {/* ── Couleur principale ──────────────────────────── */}
      <View className="gap-2">
        <Text variant="label" className="text-text-secondary">
          Couleur principale
        </Text>
        <Text style={{ fontSize: 11, color: withAlpha(Colors.black, 0.56) }}>
          Header du profil et fond des sections
        </Text>
        <PaletteRow
          colors={PRIMARY_COLORS}
          selected={primaryColor}
          onChange={onPrimaryChange}
        />
      </View>

      {/* ── Couleur secondaire ─────────────────────────── */}
      <View className="gap-2">
        <Text variant="label" className="text-text-secondary">
          Couleur d'accentuation
        </Text>
        <Text style={{ fontSize: 11, color: withAlpha(Colors.black, 0.56) }}>
          Stickers, progression et récompenses
        </Text>
        <PaletteRow
          colors={SECONDARY_COLORS}
          selected={secondaryColor}
          onChange={onSecondaryChange}
        />
      </View>
    </View>
  );
}
