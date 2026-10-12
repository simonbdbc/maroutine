import { View, TouchableOpacity } from "react-native";
import { AppIcon, Text } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import { ProfileAvatar } from "@features/profiles/components/ProfileAvatar";
import type { ProfileColorSet } from "@shared/utils/colorUtils";
import { HOME_LAYOUT_METRICS, resolveCompactMetric } from "@features/home/utils/homeLayoutMetrics";

interface HomeHeaderProps {
  profileName: string;
  stickerKey: string;
  colors: ProfileColorSet;
  balance: number;
  todayStars: number;
  compact?: boolean;
  onEditProfile: () => void;
  onOpenRewards: () => void;
}

/**
 * Header de l'écran Home — couleur dynamique du profil actif.
 * Textes sur fond primaryBase → blancs.
 */
export function HomeHeader({
  profileName,
  stickerKey,
  colors,
  balance,
  todayStars,
  compact = false,
  onEditProfile,
  onOpenRewards,
}: HomeHeaderProps) {
  const imageSize = resolveCompactMetric(HOME_LAYOUT_METRICS.header.imageSize, compact);
  const ringBorderWidth = resolveCompactMetric(HOME_LAYOUT_METRICS.header.ringBorderWidth, compact);
  const ringInset = resolveCompactMetric(HOME_LAYOUT_METRICS.header.ringInset, compact);
  const avatarSize = imageSize - (ringBorderWidth + ringInset) * 2;
  const rewardsSize = resolveCompactMetric(HOME_LAYOUT_METRICS.header.settingsSize, compact);
  const rewardsIconSize = resolveCompactMetric(
    HOME_LAYOUT_METRICS.header.settingsIconSize,
    compact
  );
  const badgeFontSize = resolveCompactMetric(HOME_LAYOUT_METRICS.header.badgeFontSize, compact);
  const badgePaddingHorizontal = resolveCompactMetric(
    HOME_LAYOUT_METRICS.header.badgePaddingHorizontal,
    compact
  );
  const badgePaddingVertical = resolveCompactMetric(
    HOME_LAYOUT_METRICS.header.badgePaddingVertical,
    compact
  );
  const badgeGap = resolveCompactMetric(HOME_LAYOUT_METRICS.header.badgeGap, compact);
  const badgesRowGap = resolveCompactMetric(HOME_LAYOUT_METRICS.header.badgesRowGap, compact);
  const headingFontSize = resolveCompactMetric(HOME_LAYOUT_METRICS.header.headingFontSize, compact);
  const subtitleFontSize = resolveCompactMetric(
    HOME_LAYOUT_METRICS.header.subtitleFontSize,
    compact
  );
  const subtitleLetterSpacing = resolveCompactMetric(
    HOME_LAYOUT_METRICS.header.subtitleLetterSpacing,
    compact
  );
  const avatarRowGap = resolveCompactMetric(HOME_LAYOUT_METRICS.header.avatarRowGap, compact);
  const badgeIconSize = resolveCompactMetric(HOME_LAYOUT_METRICS.header.badgeIconSize, compact);
  const borderRadius = resolveCompactMetric(HOME_LAYOUT_METRICS.header.borderRadius, compact);
  const paddingHorizontal = resolveCompactMetric(
    HOME_LAYOUT_METRICS.header.paddingHorizontal,
    compact
  );
  const paddingTop = resolveCompactMetric(HOME_LAYOUT_METRICS.header.paddingTop, compact);
  const paddingBottom = resolveCompactMetric(HOME_LAYOUT_METRICS.header.paddingBottom, compact);

  return (
    <View
      className="mx-1"
      style={{
        backgroundColor: colors.primaryBase,
        borderRadius,
        paddingHorizontal,
        paddingTop,
        paddingBottom,
      }}
    >
      {/* ── Row 1 : Avatar + name + rewards ─────────────────── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          // marginBottom: rowMarginBottom,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: avatarRowGap }}>
          <TouchableOpacity
            accessibilityLabel={`Modifier le profil de ${profileName}`}
            accessibilityRole="button"
            activeOpacity={0.85}
            onPress={onEditProfile}
            style={{
              width: imageSize,
              height: imageSize,
              borderRadius: imageSize / 2,
              backgroundColor: Colors.white,
              padding: ringInset,
              borderWidth: ringBorderWidth,
              borderColor: colors.secondaryBase,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ProfileAvatar
              stickerKey={stickerKey}
              size={avatarSize}
              primaryColor={colors.primaryBase}
              secondaryColor={colors.secondaryBase}
            />
          </TouchableOpacity>
          <View>
            <Text
              variant="h4"
              style={{ color: Colors.white, fontSize: headingFontSize, width: 90 }}
            >
              {profileName}
            </Text>
            <Text
              style={{
                fontSize: subtitleFontSize,
                fontFamily: "Fredoka_600SemiBold",
                color: withAlpha(Colors.white, 0.82),
                textTransform: "uppercase",
                letterSpacing: subtitleLetterSpacing,
              }}
            ></Text>
          </View>
        </View>
        {/* ── Badges tirelire + aujourd'hui + Récompenses ──────────────── */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            flexShrink: 1,
            gap: badgesRowGap,
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              borderRadius: 999,
              paddingHorizontal: badgePaddingHorizontal,
              paddingVertical: badgePaddingVertical,
              flexDirection: "row",
              alignItems: "center",
              gap: badgeGap,
              backgroundColor: withAlpha(Colors.white, 0.16),
              borderWidth: 1,
              borderColor: withAlpha(Colors.white, 0.26),
            }}
          >
            <Text
              style={{
                color: Colors.white,
                fontSize: badgeFontSize,
                fontFamily: "Fredoka_700Bold",
              }}
            >
              Tirelire : {balance}
            </Text>
            <AppIcon name="star" size={badgeIconSize} tintColor={Colors.white} />
          </View>
          <View
            style={{
              borderRadius: 999,
              paddingHorizontal: badgePaddingHorizontal,
              paddingVertical: badgePaddingVertical,
              flexDirection: "row",
              alignItems: "center",
              gap: badgeGap,
              backgroundColor: withAlpha(Colors.white, 0.16),
              borderWidth: 1,
              borderColor: withAlpha(Colors.white, 0.26),
            }}
          >
            <Text
              style={{
                color: Colors.white,
                fontSize: badgeFontSize,
                fontFamily: "Fredoka_700Bold",
              }}
            >
              Aujourd'hui : {todayStars}
            </Text>
            <AppIcon name="star" size={badgeIconSize} tintColor={Colors.white} />
          </View>
          <TouchableOpacity
            style={{
              minWidth: rewardsSize,
              height: rewardsSize,
              borderRadius: rewardsSize / 2,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 6,
              paddingHorizontal: compact ? 10 : 12,
              backgroundColor: withAlpha(Colors.white, 0.2),
              borderWidth: 2,
              borderColor: colors.secondaryBase,
            }}
            onPress={onOpenRewards}
          >
            <AppIcon name="reward" size={rewardsIconSize} tintColor={Colors.white} />
            <Text
              numberOfLines={1}
              style={{
                color: Colors.white,
                fontSize: compact ? 11 : 12,
                fontFamily: "Fredoka_700Bold",
              }}
            >
              Récompenses
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
