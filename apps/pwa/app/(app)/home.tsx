import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  ScrollView,
  Dimensions,
  useWindowDimensions,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { Text, Button } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { resolveProfileColors, withAlpha, type ProfileColorSet } from "@shared/utils/colorUtils";
import { useProfiles } from "@features/profiles/hooks/useProfiles";
import { ProfileBuilderModal } from "@features/profiles/components/ProfileBuilderModal";
import { useHomeRoutine } from "@features/home/hooks/useHomeRoutine";
import { HomeHeader } from "@features/home/components/HomeHeader";
import { DayProgressCard } from "@features/home/components/DayProgressCard";
import { MomentSection } from "@features/home/components/MomentSection";
import { ValidateDayButton } from "@features/home/components/ValidateDayButton";
import { EmptyRoutineState } from "@features/home/components/EmptyRoutineState";
import { PwaInstallHint } from "@features/home/components/PwaInstallHint";
import { isSmartphoneHomeViewport } from "@features/home/utils/homeResponsive";
import { HOME_LAYOUT_METRICS, resolveCompactMetric } from "@features/home/utils/homeLayoutMetrics";
import { resolveVisibleRoutineTabRange } from "@features/home/utils/homeRoutineTabs";
import { useAppHeaderControls } from "@navigation/appHeader";
import {
  resolveRoutineColumnCount,
  resolveRoutineCompactLayout,
  resolveRoutineColumnMinWidth,
  useLayoutPreferences,
} from "@features/preferences";
import {
  normalizePrimaryColor,
  normalizeSecondaryColor,
  type ChildProfile,
} from "@features/profiles/types";
import { ProfileRewardsModal, type RedeemProfileRewardResult } from "@features/rewards";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function paramString(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function resolveProfileThemeColors(
  profile?: Pick<ChildProfile, "primaryColor" | "secondaryColor"> | null
): ProfileColorSet {
  const primary = normalizePrimaryColor(profile?.primaryColor);
  const secondary = normalizeSecondaryColor(profile?.secondaryColor);

  return resolveProfileColors(primary, secondary);
}

// ─── Routine content for a single profile ─────────────────────────────────────
function ProfileRoutineContent({
  profile,
  focusKey,
  compact,
  onEditProfile,
  onOpenRewards,
  onBalanceChange,
}: {
  profile: ChildProfile;
  focusKey: number;
  compact: boolean;
  onEditProfile: (profile: ChildProfile) => void;
  onOpenRewards: (profileId: string) => void;
  onBalanceChange: (profileId: string, balance: number) => void;
}) {
  const {
    routine,
    loading,
    validatingDay,
    error,
    refresh,
    toggleTask,
    toggleActivity,
    doValidateDay,
  } = useHomeRoutine(profile.id);
  const profileColors = resolveProfileThemeColors(profile);

  // Re-fetch routine data when the tab gains focus
  useEffect(() => {
    if (focusKey > 0) void refresh();
  }, [focusKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !routine) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={profileColors.primaryBase} />
        <Text style={{ marginTop: 8, color: withAlpha(Colors.black, 0.56), fontSize: 13 }}>
          Chargement…
        </Text>
      </View>
    );
  }

  if (error && !routine) {
    return (
      <View
        style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}
      >
        <Text style={{ fontSize: 40 }}>⚠️</Text>
        <Text style={{ color: Colors.error, fontSize: 14, textAlign: "center", marginTop: 8 }}>
          {error}
        </Text>
        <View style={{ marginTop: 16 }}>
          <Button label="Réessayer" variant="outline" onPress={refresh} />
        </View>
      </View>
    );
  }

  if (!routine) return null;

  const hasContent = routine.moments.some((m) => m.activities.length > 0);
  const handleValidateDay = async () => {
    const result = await doValidateDay();
    if (result) {
      onBalanceChange(profile.id, result.new_balance);
    }
  };

  const contentPaddingHorizontal = resolveCompactMetric(
    HOME_LAYOUT_METRICS.content.paddingHorizontal,
    compact
  );
  const contentPaddingTop = resolveCompactMetric(HOME_LAYOUT_METRICS.content.paddingTop, compact);
  const contentPaddingBottom = resolveCompactMetric(
    HOME_LAYOUT_METRICS.content.paddingBottom,
    compact
  );
  const contentGap = resolveCompactMetric(HOME_LAYOUT_METRICS.content.gap, compact);

  return (
    <View style={{ flex: 1, minHeight: 0, backgroundColor: Colors.white }}>
      {/* ── Header (primaryBase) ──────────────────────────── */}
      <HomeHeader
        profileName={profile.name}
        stickerKey={profile.stickerKey}
        colors={profileColors}
        balance={profile.balance}
        todayStars={routine.todayStars}
        compact={compact}
        onEditProfile={() => onEditProfile(profile)}
        onOpenRewards={() => onOpenRewards(routine.profileId)}
      />

      {/* ── Progress card (overlaps header) ────────────────── */}
      <DayProgressCard
        profileName={profile.name}
        totalCompleted={routine.totalCompleted}
        totalItems={routine.totalItems}
        progressPercent={routine.progressPercent}
        colors={profileColors}
        compact={compact}
      />

      {/* ── Content ────────────────────────────────────────── */}
      {!hasContent ? (
        <EmptyRoutineState />
      ) : (
        <View style={{ flex: 1, minHeight: 0 }}>
          <ScrollView
            style={{ flex: 1, minHeight: 0 }}
            contentContainerStyle={{
              paddingHorizontal: contentPaddingHorizontal,
              paddingTop: contentPaddingTop,
              paddingBottom: contentPaddingBottom,
              gap: contentGap,
            }}
            showsVerticalScrollIndicator={false}
            directionalLockEnabled
            alwaysBounceHorizontal={false}
            nestedScrollEnabled
          >
            {routine.moments.map((moment) => {
              if (moment.activities.length === 0) return null;
              return (
                <MomentSection
                  key={moment.pivotId}
                  moment={moment}
                  colors={profileColors}
                  compact={compact}
                  disabled={routine.isDayValidated}
                  onToggleActivity={(activity, m) => toggleActivity(activity, m)}
                  onToggleTask={(task, activity, m) => toggleTask(task, activity, m)}
                />
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ── Validate button (sticky bottom) ─────────────────── */}
      {hasContent && (
        <ValidateDayButton
          colors={profileColors}
          compact={compact}
          isDayValidated={routine.isDayValidated}
          validatingDay={validatingDay}
          todayStars={routine.todayStars}
          progressPercent={routine.progressPercent}
          onValidate={() => void handleValidateDay()}
        />
      )}
    </View>
  );
}

// ─── Profile tabs (v1 behavior) ──────────────────────────────────────────────
function ProfileTabs({
  profiles,
  activeIndex,
  visibleRoutineCount,
  compact,
  onSelectIndex,
}: {
  profiles: ChildProfile[];
  activeIndex: number;
  visibleRoutineCount: number;
  compact: boolean;
  onSelectIndex: (index: number) => void;
}) {
  if (profiles.length <= 1) return null;

  const activeTabRange = resolveVisibleRoutineTabRange({
    activeIndex,
    routineColumnCount: visibleRoutineCount,
    profileCount: profiles.length,
  });

  const containerGap = resolveCompactMetric(HOME_LAYOUT_METRICS.profileTabs.containerGap, compact);
  const containerPaddingHorizontal = resolveCompactMetric(
    HOME_LAYOUT_METRICS.profileTabs.containerPaddingHorizontal,
    compact
  );
  const containerPaddingTop = resolveCompactMetric(
    HOME_LAYOUT_METRICS.profileTabs.containerPaddingTop,
    compact
  );
  const containerPaddingBottom = resolveCompactMetric(
    HOME_LAYOUT_METRICS.profileTabs.containerPaddingBottom,
    compact
  );
  const buttonBorderWidth = resolveCompactMetric(
    HOME_LAYOUT_METRICS.profileTabs.buttonBorderWidth,
    compact
  );
  const buttonPaddingHorizontal = resolveCompactMetric(
    HOME_LAYOUT_METRICS.profileTabs.buttonPaddingHorizontal,
    compact
  );
  const buttonPaddingVertical = resolveCompactMetric(
    HOME_LAYOUT_METRICS.profileTabs.buttonPaddingVertical,
    compact
  );
  const buttonMaxWidth = resolveCompactMetric(
    HOME_LAYOUT_METRICS.profileTabs.buttonMaxWidth,
    compact
  );
  const labelFontSize = resolveCompactMetric(
    HOME_LAYOUT_METRICS.profileTabs.labelFontSize,
    compact
  );

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: containerGap,
        paddingHorizontal: containerPaddingHorizontal,
        paddingTop: containerPaddingTop,
        paddingBottom: containerPaddingBottom,
        backgroundColor: Colors.white,
      }}
    >
      {profiles.map((profile, index) => {
        const isActive = index >= activeTabRange.startIndex && index < activeTabRange.endIndex;
        const profileColors = resolveProfileThemeColors(profile);
        return (
          <TouchableOpacity
            key={profile.id}
            onPress={() => onSelectIndex(index)}
            activeOpacity={0.8}
            style={{
              borderRadius: 999,
              borderWidth: buttonBorderWidth,
              borderColor: isActive ? profileColors.secondaryBase : profileColors.primaryBase,
              backgroundColor: isActive ? profileColors.primaryBase : withAlpha(Colors.white, 0.9),
              paddingHorizontal: buttonPaddingHorizontal,
              paddingVertical: buttonPaddingVertical,
              maxWidth: buttonMaxWidth,
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                fontFamily: "Fredoka_700Bold",
                fontSize: labelFontSize,
                color: isActive ? Colors.white : profileColors.primaryBase,
              }}
            >
              {profile.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Main HomeScreen ──────────────────────────────────────────────────────────
export default function HomeScreen() {
  const {
    profiles,
    loading: profilesLoading,
    refresh: refreshProfiles,
    replaceLocal: replaceProfileLocal,
    patchLocal: patchProfileLocal,
  } = useProfiles();
  const params = useLocalSearchParams<{
    profileId?: string | string[];
  }>();
  const { width: viewportWidth } = useWindowDimensions();
  const { preferences } = useLayoutPreferences();
  const pagerRef = useRef<ScrollView>(null);
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pageWidth, setPageWidth] = useState(() => SCREEN_WIDTH);

  const [focusKey, setFocusKey] = useState(0);
  const [editingProfile, setEditingProfile] = useState<ChildProfile | null>(null);
  const [rewardsModalProfileId, setRewardsModalProfileId] = useState<string | null>(null);
  const routeProfileId = paramString(params.profileId);
  const compactHome = isSmartphoneHomeViewport(viewportWidth);
  const compactRoutine = resolveRoutineCompactLayout({
    isSmartphone: compactHome,
    routineDisplayMode: preferences.routineDisplayMode,
  });
  const routineColumnCount = resolveRoutineColumnCount({
    profileCount: profiles.length,
    containerWidth: pageWidth,
    isSmartphone: compactHome,
    routineLayoutMode: preferences.routineLayoutMode,
    minColumnWidth: resolveRoutineColumnMinWidth({
      adapted: preferences.routineDisplayMode === "adapted",
    }),
  });
  const safeRoutineColumnCount = Math.max(1, routineColumnCount);
  const profilePages = useMemo(() => {
    const pages: ChildProfile[][] = [];
    for (let index = 0; index < profiles.length; index += safeRoutineColumnCount) {
      pages.push(profiles.slice(index, index + safeRoutineColumnCount));
    }
    return pages;
  }, [profiles, safeRoutineColumnCount]);
  const routinePageGap = safeRoutineColumnCount > 1 ? 12 : 0;
  const routinePagePaddingHorizontal = safeRoutineColumnCount > 1 ? 8 : 0;
  const routineColumnWidth =
    safeRoutineColumnCount > 1
      ? Math.max(
          0,
          (pageWidth -
            routinePagePaddingHorizontal * 2 -
            routinePageGap * (safeRoutineColumnCount - 1)) /
            safeRoutineColumnCount
        )
      : pageWidth;

  // Refresh profiles & routines each time the tab gains focus
  useFocusEffect(
    useCallback(() => {
      void refreshProfiles();
      setFocusKey((k) => k + 1);
    }, [refreshProfiles])
  );

  const isProgrammaticScroll = useRef(false);

  const setActiveIndexSynced = useCallback((next: number) => {
    if (next === activeIndexRef.current) return;
    activeIndexRef.current = next;
    setActiveIndex(next);
  }, []);

  const goToIndex = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(profiles.length - 1, index));
      setActiveIndexSynced(next);
      isProgrammaticScroll.current = true;
      const nextPage = Math.floor(next / safeRoutineColumnCount);
      pagerRef.current?.scrollTo({
        x: nextPage * pageWidth,
        y: 0,
        animated: true,
      });
      // Reset flag after animation completes
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 350);
    },
    [pageWidth, profiles.length, safeRoutineColumnCount, setActiveIndexSynced]
  );

  useEffect(() => {
    if (!routeProfileId || profiles.length === 0) return;
    const targetIndex = profiles.findIndex((profile) => profile.id === routeProfileId);
    if (targetIndex >= 0) {
      goToIndex(targetIndex);
    }
  }, [goToIndex, profiles, routeProfileId]);

  const handlePagerLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const nextWidth = Math.round(event.nativeEvent.layout.width);
      if (nextWidth <= 0 || nextWidth === pageWidth) return;

      setPageWidth(nextWidth);
      isProgrammaticScroll.current = true;
      const nextPage = Math.floor(activeIndexRef.current / safeRoutineColumnCount);
      pagerRef.current?.scrollTo({
        x: nextPage * nextWidth,
        y: 0,
        animated: false,
      });
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 50);
    },
    [pageWidth, safeRoutineColumnCount]
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (pageWidth <= 0 || isProgrammaticScroll.current) return;

      const offsetX = event.nativeEvent.contentOffset.x;
      const pageIndex = Math.round(offsetX / pageWidth);
      const next = Math.max(0, Math.min(profiles.length - 1, pageIndex * safeRoutineColumnCount));
      setActiveIndexSynced(next);
    },
    [pageWidth, profiles.length, safeRoutineColumnCount, setActiveIndexSynced]
  );

  const stopWheelPropagation = useCallback((event: any) => {
    if (Platform.OS === "web") {
      event?.stopPropagation?.();
    }
  }, []);

  const openProfileEditor = useCallback((profile: ChildProfile) => {
    setEditingProfile(profile);
  }, []);

  const openProfileRewards = useCallback((profileId: string) => {
    setRewardsModalProfileId(profileId);
  }, []);

  const closeProfileEditor = useCallback(() => {
    setEditingProfile(null);
  }, []);

  const handleProfileSaved = useCallback(
    (profile: ChildProfile) => {
      replaceProfileLocal(profile);
      setEditingProfile(null);
    },
    [replaceProfileLocal]
  );

  const closeProfileRewards = useCallback(() => {
    setRewardsModalProfileId(null);
  }, []);

  const handleBalanceChange = useCallback(
    (profileId: string, balance: number) => {
      patchProfileLocal(profileId, { balance });
    },
    [patchProfileLocal]
  );

  const handleRewardRedeemed = useCallback(
    (result: RedeemProfileRewardResult) => {
      patchProfileLocal(result.profileId, { balance: result.newBalance });
    },
    [patchProfileLocal]
  );

  // Keep index in bounds when profiles change
  useEffect(() => {
    if (profiles.length === 0) {
      activeIndexRef.current = 0;
      setActiveIndex(0);
      return;
    }

    if (activeIndexRef.current >= profiles.length) {
      const next = profiles.length - 1;
      setActiveIndexSynced(next);
      const nextPage = Math.floor(next / safeRoutineColumnCount);
      pagerRef.current?.scrollTo({
        x: nextPage * pageWidth,
        y: 0,
        animated: false,
      });
    }
  }, [pageWidth, profiles.length, safeRoutineColumnCount, setActiveIndexSynced]);

  useEffect(() => {
    if (profiles.length <= 1 || pageWidth <= 0) return;
    const nextPage = Math.floor(activeIndexRef.current / safeRoutineColumnCount);
    isProgrammaticScroll.current = true;
    pagerRef.current?.scrollTo({
      x: nextPage * pageWidth,
      y: 0,
      animated: false,
    });
    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 50);
  }, [pageWidth, profiles.length, safeRoutineColumnCount]);

  // Active profile for SafeAreaView background color
  const activeProfile = profiles[activeIndex] ?? profiles[0];
  const activeProfileColors = resolveProfileThemeColors(activeProfile);
  const headerSecondary = useMemo(
    () =>
      profiles.length > 1 ? (
        <ProfileTabs
          profiles={profiles}
          activeIndex={activeIndex}
          visibleRoutineCount={safeRoutineColumnCount}
          compact={compactRoutine}
          onSelectIndex={goToIndex}
        />
      ) : null,
    [activeIndex, compactRoutine, goToIndex, profiles, safeRoutineColumnCount]
  );

  useAppHeaderControls({ secondary: headerSecondary });

  // ── Loading state ─────────────────────────────────────
  if (profilesLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }} edges={["top"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ marginTop: 12, color: withAlpha(Colors.black, 0.56) }}>
            Chargement des profils…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── No profiles ───────────────────────────────────────
  if (profiles.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }} edges={["top"]}>
        <PwaInstallHint />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
            gap: 16,
          }}
        >
          <Text style={{ fontSize: 48 }}>👦</Text>
          <Text
            style={{
              fontFamily: "Fredoka_700Bold",
              fontSize: 20,
              color: withAlpha(Colors.black, 0.72),
              textAlign: "center",
            }}
          >
            Aucun profil enfant
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: withAlpha(Colors.black, 0.56),
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Crée un profil dans Enfants pour commencer la routine.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Single or multi-profile ───────────────────────────
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: activeProfileColors.primaryBase }}
      edges={["top"]}
    >
      <PwaInstallHint />
      {profiles.length === 1 ? (
        <ProfileRoutineContent
          profile={profiles[0]!}
          focusKey={focusKey}
          compact={compactRoutine}
          onEditProfile={openProfileEditor}
          onOpenRewards={openProfileRewards}
          onBalanceChange={handleBalanceChange}
        />
      ) : (
        <View style={{ flex: 1, minHeight: 0 }}>
          <View
            style={{ flex: 1, minHeight: 0 }}
            onLayout={handlePagerLayout}
            {...(Platform.OS === "web" ? ({ onWheelCapture: stopWheelPropagation } as any) : {})}
          >
            <ScrollView
              ref={pagerRef}
              horizontal
              pagingEnabled
              bounces={false}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              directionalLockEnabled
              alwaysBounceVertical={false}
              nestedScrollEnabled
              style={{ flex: 1, minHeight: 0 }}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              {profilePages.map((pageProfiles, pageIndex) => (
                <View
                  key={pageProfiles.map((profile) => profile.id).join(":") || `page-${pageIndex}`}
                  style={{
                    width: pageWidth,
                    flex: 1,
                    minHeight: 0,
                    flexDirection: safeRoutineColumnCount > 1 ? "row" : "column",
                    gap: routinePageGap,
                    paddingHorizontal: routinePagePaddingHorizontal,
                    backgroundColor: Colors.white,
                  }}
                >
                  {pageProfiles.map((profile) => (
                    <View
                      key={profile.id}
                      style={{
                        width: routineColumnWidth,
                        flex: 1,
                        minHeight: 0,
                        overflow: "hidden",
                      }}
                    >
                      <ProfileRoutineContent
                        profile={profile}
                        focusKey={focusKey}
                        compact={compactRoutine}
                        onEditProfile={openProfileEditor}
                        onOpenRewards={openProfileRewards}
                        onBalanceChange={handleBalanceChange}
                      />
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
      <ProfileBuilderModal
        visible={editingProfile !== null}
        profile={editingProfile}
        onSaved={handleProfileSaved}
        onClose={closeProfileEditor}
      />
      <ProfileRewardsModal
        visible={Boolean(rewardsModalProfileId)}
        profileId={rewardsModalProfileId}
        initialProfileName={
          profiles.find((profile) => profile.id === rewardsModalProfileId)?.name ?? undefined
        }
        onClose={closeProfileRewards}
        onRedeemed={handleRewardRedeemed}
      />
    </SafeAreaView>
  );
}
