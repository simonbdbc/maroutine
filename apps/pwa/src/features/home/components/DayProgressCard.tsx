import { View } from "react-native";
import { Text } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import type { ProfileColorSet } from "@shared/utils/colorUtils";
import {
  HOME_LAYOUT_METRICS,
  resolveCompactMetric,
} from "@features/home/utils/homeLayoutMetrics";

interface DayProgressCardProps {
  profileName: string;
  totalCompleted: number;
  totalItems: number;
  progressPercent: number;
  colors: ProfileColorSet;
  compact?: boolean;
}

/**
 * Carte de progression du jour — flotte au-dessus du contenu.
 * Barre de progression = secondaryBase.
 */
export function DayProgressCard({
  profileName,
  totalCompleted,
  totalItems,
  progressPercent,
  colors,
  compact = false,
}: DayProgressCardProps) {
  const message =
    progressPercent === 100
      ? `Bravo ${profileName} !`
      : progressPercent >= 50
      ? `Super ${profileName} !`
      : `Allez ${profileName} !`;
  const marginHorizontal = resolveCompactMetric(
    HOME_LAYOUT_METRICS.dayProgressCard.marginHorizontal,
    compact,
  );
  const marginTop = resolveCompactMetric(
    HOME_LAYOUT_METRICS.dayProgressCard.marginTop,
    compact,
  );
  const borderRadius = resolveCompactMetric(
    HOME_LAYOUT_METRICS.dayProgressCard.borderRadius,
    compact,
  );
  const padding = resolveCompactMetric(
    HOME_LAYOUT_METRICS.dayProgressCard.padding,
    compact,
  );
  const rowMarginBottom = resolveCompactMetric(
    HOME_LAYOUT_METRICS.dayProgressCard.rowMarginBottom,
    compact,
  );
  const titleFontSize = resolveCompactMetric(
    HOME_LAYOUT_METRICS.dayProgressCard.titleFontSize,
    compact,
  );
  const subtitleFontSize = resolveCompactMetric(
    HOME_LAYOUT_METRICS.dayProgressCard.subtitleFontSize,
    compact,
  );
  const titleSubtitleGap = resolveCompactMetric(
    HOME_LAYOUT_METRICS.dayProgressCard.titleSubtitleGap,
    compact,
  );
  const countFontSize = resolveCompactMetric(
    HOME_LAYOUT_METRICS.dayProgressCard.countFontSize,
    compact,
  );
  const progressHeight = resolveCompactMetric(
    HOME_LAYOUT_METRICS.dayProgressCard.progressHeight,
    compact,
  );
  const progressRadius = resolveCompactMetric(
    HOME_LAYOUT_METRICS.dayProgressCard.progressRadius,
    compact,
  );

  return (
    <View
      style={{
        marginHorizontal,
        marginTop,
        borderRadius,
        padding,
        backgroundColor: Colors.white,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: withAlpha(Colors.grey, 0.8),
        zIndex: 20,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: rowMarginBottom,
        }}
      >
        <View>
          <Text
            style={{
              color: Colors.black,
              fontFamily: "Fredoka_700Bold",
              fontSize: titleFontSize,
            }}
          >
            Progression du jour
          </Text>
          <Text
            style={{
              color: withAlpha(Colors.black, 0.56),
              fontSize: subtitleFontSize,
              marginTop: titleSubtitleGap,
              fontFamily: "Fredoka_700Bold",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {message}
          </Text>
        </View>
        <Text
          style={{
            color: Colors.black,
            fontFamily: "Fredoka_700Bold",
            fontSize: countFontSize,
          }}
        >
          {totalCompleted} / {totalItems}
        </Text>
      </View>

      {/* Progress bar */}
      <View
        style={{
          height: progressHeight,
          backgroundColor: withAlpha(Colors.grey, 0.65),
          borderRadius: progressRadius,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${progressPercent}%`,
            backgroundColor: colors.secondaryBase,
            borderRadius: progressRadius,
          }}
        />
      </View>
    </View>
  );
}
