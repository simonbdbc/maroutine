import { View } from "react-native";
import { Text } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { ActivityCard } from "./ActivityCard";
import type { MomentVM, TaskVM, ActivityVM } from "../types";
import type { ProfileColorSet } from "@shared/utils/colorUtils";
import { withAlpha } from "@shared/utils/colorUtils";
import {
  HOME_LAYOUT_METRICS,
  resolveCompactMetric,
} from "@features/home/utils/homeLayoutMetrics";

interface MomentSectionProps {
  moment: MomentVM;
  colors: ProfileColorSet;
  compact?: boolean;
  disabled?: boolean;
  onToggleActivity: (activity: ActivityVM, moment: MomentVM) => void;
  onToggleTask: (task: TaskVM, activity: ActivityVM, moment: MomentVM) => void;
}

/**
 * Section d'un moment de la journée.
 * Header = primaryBase (texte blanc).
 * Body/fond = primaryPastel.
 */
export function MomentSection({
  moment,
  colors,
  compact = false,
  disabled = false,
  onToggleActivity,
  onToggleTask,
}: MomentSectionProps) {
  // const icon = MOMENT_ICONS[moment.kind] ?? "📋";
  const icon = "📋";
  const sectionRadius = resolveCompactMetric(
    HOME_LAYOUT_METRICS.momentSection.sectionRadius,
    compact,
  );
  const sectionHeaderPaddingHorizontal = resolveCompactMetric(
    HOME_LAYOUT_METRICS.momentSection.headerPaddingHorizontal,
    compact,
  );
  const sectionHeaderPaddingVertical = resolveCompactMetric(
    HOME_LAYOUT_METRICS.momentSection.headerPaddingVertical,
    compact,
  );
  const sectionBodyPadding = resolveCompactMetric(
    HOME_LAYOUT_METRICS.momentSection.bodyPadding,
    compact,
  );
  const sectionBodyGap = resolveCompactMetric(
    HOME_LAYOUT_METRICS.momentSection.bodyGap,
    compact,
  );
  const activitiesGap = resolveCompactMetric(
    HOME_LAYOUT_METRICS.momentSection.activitiesGap,
    compact,
  );
  const iconSize = resolveCompactMetric(HOME_LAYOUT_METRICS.momentSection.iconSize, compact);
  const titleSize = resolveCompactMetric(HOME_LAYOUT_METRICS.momentSection.titleSize, compact);
  const countSize = resolveCompactMetric(HOME_LAYOUT_METRICS.momentSection.countSize, compact);

  return (
    <View
      style={{
        borderRadius: sectionRadius,
        overflow: "hidden",
        backgroundColor: colors.primaryPastel,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderBottomWidth: 4,
        borderBottomColor: colors.primaryPastel,
      }}
    >
      {/* ── Header du moment (primaryBase, texte blanc) ──── */}
      <View
        style={{
          paddingHorizontal: sectionHeaderPaddingHorizontal,
          paddingVertical: sectionHeaderPaddingVertical,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: colors.primaryBase,
        }}
      >
        <View className="flex-row items-center gap-2">
          <Text style={{ fontSize: iconSize }}>{icon}</Text>
          <Text
            style={{
              fontSize: titleSize,
              fontFamily: "Fredoka_700Bold",
              color: Colors.white,
            }}
          >
            {moment.name}
          </Text>
        </View>
        <Text
          style={{
            fontSize: countSize,
            fontFamily: "Fredoka_700Bold",
            color: Colors.white,
          }}
        >
          {moment.completedActivities}/{moment.totalActivities}
        </Text>
      </View>

      {/* ── Activités ──────────────────────────────────────── */}
      <View style={{ padding: sectionBodyPadding, gap: sectionBodyGap }}>
        <View style={{ gap: activitiesGap }}>
          {moment.activities.map((activity) => (
            <ActivityCard
              key={activity.pivotId}
              activity={activity}
              colors={colors}
              compact={compact}
              disabled={disabled}
              onToggleActivity={() => onToggleActivity(activity, moment)}
              onToggleTask={(task) => onToggleTask(task, activity, moment)}
            />
          ))}
        </View>

        {moment.activities.length === 0 && (
          <View className="py-4 items-center">
            <Text style={{ color: withAlpha(Colors.black, 0.56), fontSize: 13 }}>
              Aucune activité pour ce moment
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
