import { TouchableOpacity, View } from "react-native";
import { Text } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import type { TaskVM } from "../types";
import type { ProfileColorSet } from "@shared/utils/colorUtils";
import { HOME_LAYOUT_METRICS, resolveCompactMetric } from "@features/home/utils/homeLayoutMetrics";

interface TaskRowProps {
  task: TaskVM;
  colors: ProfileColorSet;
  compact?: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

/**
 * Ligne de tâche — texte gris + 2 cercles d'état (✗ / ✓), sans sticker.
 */
export function TaskRow({
  task,
  colors,
  compact = false,
  disabled = false,
  onToggle,
}: TaskRowProps) {
  const iconSize = resolveCompactMetric(HOME_LAYOUT_METRICS.taskRow.iconSize, compact);
  const iconGlyphSize = resolveCompactMetric(HOME_LAYOUT_METRICS.taskRow.iconGlyphSize, compact);
  const iconsGap = resolveCompactMetric(HOME_LAYOUT_METRICS.taskRow.iconsGap, compact);
  const paddingHorizontal = resolveCompactMetric(
    HOME_LAYOUT_METRICS.taskRow.paddingHorizontal,
    compact
  );
  const paddingVertical = resolveCompactMetric(
    HOME_LAYOUT_METRICS.taskRow.paddingVertical,
    compact
  );
  const borderRadius = resolveCompactMetric(HOME_LAYOUT_METRICS.taskRow.borderRadius, compact);
  const labelFontSize = resolveCompactMetric(HOME_LAYOUT_METRICS.taskRow.labelFontSize, compact);
  const labelMarginRight = resolveCompactMetric(
    HOME_LAYOUT_METRICS.taskRow.labelMarginRight,
    compact
  );
  const pendingActive = !task.checked;
  const doneActive = task.checked;

  return (
    <TouchableOpacity
      onPress={onToggle}
      disabled={disabled}
      activeOpacity={0.6}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal,
        paddingVertical,
        borderRadius,
        backgroundColor: withAlpha(Colors.white, 0.6),
        borderWidth: 1,
        borderColor: withAlpha(Colors.white, 0.4),
      }}
    >
      <Text
        style={{
          fontSize: labelFontSize,
          fontFamily: "Fredoka_600SemiBold",
          color: withAlpha(Colors.black, 0.72),
          flex: 1,
          marginRight: labelMarginRight,
        }}
        numberOfLines={2}
      >
        {task.name}
      </Text>

      <View style={{ flexDirection: "row", gap: iconsGap }}>
        <View
          style={{
            width: iconSize,
            height: iconSize,
            borderRadius: iconSize / 2,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: pendingActive ? 1.5 : 1,
            borderColor: pendingActive ? colors.secondaryBase : Colors.grey,
            backgroundColor: pendingActive ? colors.secondaryPastel : withAlpha(Colors.white, 0.8),
          }}
        >
          <Text
            style={{
              fontSize: iconGlyphSize,
              color: pendingActive ? Colors.black : withAlpha(Colors.black, 0.56),
            }}
          >
            ✗
          </Text>
        </View>
        <View
          style={{
            width: iconSize,
            height: iconSize,
            borderRadius: iconSize / 2,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: doneActive ? 1.5 : 1,
            borderColor: doneActive ? colors.secondaryBase : Colors.grey,
            backgroundColor: doneActive ? colors.secondaryPastel : withAlpha(Colors.white, 0.8),
          }}
        >
          <Text
            style={{
              fontSize: iconGlyphSize,
              color: doneActive ? colors.primaryBase : withAlpha(Colors.black, 0.56),
            }}
          >
            ✓
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
