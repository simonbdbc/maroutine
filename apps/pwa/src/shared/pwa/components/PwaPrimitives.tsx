import { View } from "react-native";
import { Badge, Text } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";

export function PwaSectionHeader({ label }: { label: string }) {
  return (
    <Text
      style={{
        color: withAlpha(Colors.black, 0.56),
        fontFamily: "Fredoka_600SemiBold",
        fontSize: 11,
        letterSpacing: 1.2,
        textTransform: "uppercase",
      }}
    >
      {label}
    </Text>
  );
}

export function PwaStatusRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}
    >
      <Text style={{ color: withAlpha(Colors.black, 0.58), fontSize: 13 }}>{label}</Text>
      <Text selectable style={{ color: Colors.black, flex: 1, fontSize: 13, textAlign: "right" }}>
        {value}
      </Text>
    </View>
  );
}

export function PwaInstructionList({ items }: { items: string[] }) {
  return (
    <View style={{ gap: 8 }}>
      {items.map((item, index) => (
        <View key={item} style={{ alignItems: "flex-start", flexDirection: "row", gap: 8 }}>
          <Badge label={String(index + 1)} size="sm" variant="muted" />
          <Text
            style={{ color: withAlpha(Colors.black, 0.72), flex: 1, fontSize: 13, lineHeight: 18 }}
          >
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function formatPwaBytes(value: number | null): string {
  if (!value || value <= 0) return "0 o";
  const units = ["o", "Ko", "Mo", "Go"];
  let nextValue = value;
  let unitIndex = 0;
  while (nextValue >= 1024 && unitIndex < units.length - 1) {
    nextValue /= 1024;
    unitIndex += 1;
  }
  return `${nextValue.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
