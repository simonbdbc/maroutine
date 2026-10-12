import { TouchableOpacity, View } from "react-native";
import { Text } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import { StickerSlot } from "./StickerSlot";
import { TaskRow } from "./TaskRow";
import type { ActivityVM, TaskVM } from "../types";
import type { ProfileColorSet } from "@shared/utils/colorUtils";
import { HOME_LAYOUT_METRICS, resolveCompactMetric } from "@features/home/utils/homeLayoutMetrics";

interface ActivityCardProps {
  activity: ActivityVM;
  colors: ProfileColorSet;
  compact?: boolean;
  disabled?: boolean;
  onToggleActivity: () => void;
  onToggleTask: (task: TaskVM) => void;
}

/**
 * Carte d'activité — fond blanc, titre noir (gras), icône, sticker slots.
 * Les tâches enfants sont affichées en dessous avec un léger indent.
 */
export function ActivityCard({
  activity,
  colors,
  compact = false,
  disabled = false,
  onToggleActivity,
  onToggleTask,
}: ActivityCardProps) {
  const activityDone = activity.checked;
  const hasTasks = activity.totalTasks > 0;
  const activityStickerKey = activity.pendingStickerKey;
  const activitySubtitle = hasTasks
    ? `${activity.completedTasks}/${activity.totalTasks} tâches`
    : "Activité simple";
  const flowLeft = resolveCompactMetric(HOME_LAYOUT_METRICS.activityCard.flowLeft, compact);
  const flowTop = resolveCompactMetric(HOME_LAYOUT_METRICS.activityCard.flowTop, compact);
  const flowBottom = resolveCompactMetric(HOME_LAYOUT_METRICS.activityCard.flowBottom, compact);
  const flowWidth = resolveCompactMetric(HOME_LAYOUT_METRICS.activityCard.flowWidth, compact);
  const headerPadding = resolveCompactMetric(
    HOME_LAYOUT_METRICS.activityCard.headerPadding,
    compact
  );
  const headerRadius = resolveCompactMetric(HOME_LAYOUT_METRICS.activityCard.headerRadius, compact);
  const headerMarginBottom = resolveCompactMetric(
    HOME_LAYOUT_METRICS.activityCard.headerMarginBottom,
    compact
  );
  const leadingContainerSize = resolveCompactMetric(
    HOME_LAYOUT_METRICS.activityCard.leadingContainerSize,
    compact
  );
  const statusSize = resolveCompactMetric(HOME_LAYOUT_METRICS.activityCard.statusSize, compact);
  const statusCheckFontSize = resolveCompactMetric(
    HOME_LAYOUT_METRICS.activityCard.statusCheckFontSize,
    compact
  );
  const titleFontSize = resolveCompactMetric(
    HOME_LAYOUT_METRICS.activityCard.titleFontSize,
    compact
  );
  const subtitleFontSize = resolveCompactMetric(
    HOME_LAYOUT_METRICS.activityCard.subtitleFontSize,
    compact
  );
  const subtitleMarginRight = resolveCompactMetric(
    HOME_LAYOUT_METRICS.activityCard.subtitleMarginRight,
    compact
  );
  const rowGap = resolveCompactMetric(HOME_LAYOUT_METRICS.activityCard.rowGap, compact);
  const stickerGap = resolveCompactMetric(HOME_LAYOUT_METRICS.activityCard.stickerGap, compact);
  const taskIndent = resolveCompactMetric(HOME_LAYOUT_METRICS.activityCard.taskIndent, compact);
  const taskGap = resolveCompactMetric(HOME_LAYOUT_METRICS.activityCard.taskGap, compact);
  const leadingBorderRadius = resolveCompactMetric(
    HOME_LAYOUT_METRICS.activityCard.leadingBorderRadius,
    compact
  );

  return (
    <View style={{ position: "relative" }}>
      {/* Flow line vertical */}
      <View
        style={{
          position: "absolute",
          left: flowLeft,
          top: flowTop,
          bottom: flowBottom,
          width: flowWidth,
          backgroundColor: colors.primaryPastel,
          borderRadius: 2,
          opacity: 0.5,
        }}
      />

      {/* Activity header card */}
      <TouchableOpacity
        onPress={onToggleActivity}
        disabled={disabled}
        activeOpacity={0.75}
        style={{
          borderRadius: headerRadius,
          padding: headerPadding,
          marginBottom: headerMarginBottom,
          backgroundColor: Colors.white,
          borderWidth: 1,
          borderColor: colors.primaryPastel,
          shadowColor: Colors.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 1,
          zIndex: 10,
          opacity: disabled ? 0.7 : 1,
        }}
      >
        <View
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: rowGap, flex: 1 }}>
            <View
              style={{
                width: leadingContainerSize,
                height: leadingContainerSize,
                borderRadius: leadingBorderRadius,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.primaryPastel,
              }}
            >
              <View
                style={{
                  width: statusSize,
                  height: statusSize,
                  borderRadius: statusSize / 2,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: activityDone ? 1.5 : 1,
                  borderColor: activityDone ? colors.secondaryBase : Colors.grey,
                  backgroundColor: activityDone
                    ? colors.secondaryPastel
                    : withAlpha(Colors.white, 0.8),
                }}
              >
                {activityDone ? (
                  <Text style={{ fontSize: statusCheckFontSize, color: colors.primaryBase }}>
                    ✓
                  </Text>
                ) : (
                  <Text
                    style={{ fontSize: statusCheckFontSize, color: withAlpha(Colors.black, 0.56) }}
                  >
                    ✗
                  </Text>
                )}
              </View>
            </View>
            <Text
              style={{
                fontFamily: "Fredoka_700Bold",
                fontSize: titleFontSize,
                color: Colors.black,
                flex: 1,
              }}
              numberOfLines={2}
            >
              {activity.name}
            </Text>
            <Text
              style={{
                fontSize: subtitleFontSize,
                fontFamily: "Fredoka_600SemiBold",
                color: withAlpha(Colors.black, 0.72),
                marginRight: subtitleMarginRight,
              }}
            >
              {activitySubtitle}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: stickerGap }}>
            {/* Slot pending (gauche) */}
            <StickerSlot
              stickerKey={activityDone ? null : activityStickerKey}
              variant="activity"
              compact={compact}
              simple
              filledColor={colors.secondaryBase}
            />
            {/* Slot done (droite) */}
            <StickerSlot
              stickerKey={activityDone ? activityStickerKey : null}
              variant="activity"
              compact={compact}
              filledColor={colors.secondaryBase}
              stars={activity.stars}
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Task rows — indented */}
      <View style={{ marginLeft: taskIndent, gap: taskGap, zIndex: 10 }}>
        {activity.tasks.map((task) => (
          <TaskRow
            key={task.pivotId}
            task={task}
            colors={colors}
            compact={compact}
            disabled={disabled}
            onToggle={() => onToggleTask(task)}
          />
        ))}
      </View>
    </View>
  );
}
