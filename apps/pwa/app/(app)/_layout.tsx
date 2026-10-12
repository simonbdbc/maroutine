import { useEffect, useMemo, useState } from "react";
import { Slot, usePathname, useRouter } from "expo-router";
import {
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppIcon, Text } from "@shared/components/ui";
import { PwaGlobalPrompts, usePwa } from "@shared/pwa";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import { initAuthStore, useAuthStore } from "@features/auth/stores/authStore";
import {
  LayoutPreferencesProvider,
  FIXED_SIDE_MENU_MIN_WIDTH,
  canUseFixedSideMenuByContext,
  resolveEffectiveSideMenuMode,
  useLayoutPreferences,
} from "@features/preferences";
import { AppHeaderControlsProvider, useAppHeaderControlsState } from "@navigation/appHeader";
import {
  AppSideMenuContent,
  nativeSidebarStyle,
  resolveAppMenuTitle,
  webDesktopContentStyle,
  webSidebarStyle,
} from "@navigation/sideMenu";

const HEADER_MENU_ICON_SIZE = 34;
const webBackdropStyle = {
  bottom: 0,
  left: 0,
  position: "fixed",
  right: 0,
  top: 0,
  zIndex: 40,
} as unknown as ViewStyle;
const nativeBackdropStyle: ViewStyle = {
  bottom: 0,
  left: 0,
  position: "absolute",
  right: 0,
  top: 0,
  zIndex: 40,
};

function AppLayoutShell() {
  const router = useRouter();
  const pathname = usePathname();
  const { width: viewportWidth } = useWindowDimensions();
  const { status } = useAuthStore();
  const { left, right, secondary, title: titleOverride } = useAppHeaderControlsState();
  const { isInstallPromotionVisible, menuPwaLabel, menuPwaTarget } = usePwa();
  const { preferences, setRoutineDisplayMode, setRoutineLayoutMode, setSideMenuMode } =
    useLayoutPreferences();
  const [menuOpen, setMenuOpen] = useState(false);
  const layoutViewportContext = useMemo(
    () => ({
      platform: Platform.OS === "web" ? ("web" as const) : ("native" as const),
      userAgent: (globalThis as { navigator?: { userAgent?: string } }).navigator?.userAgent ?? "",
    }),
    []
  );
  const canUsePersistentSidebar = canUseFixedSideMenuByContext({
    width: viewportWidth,
    context: layoutViewportContext,
    desktopBreakpoint: FIXED_SIDE_MENU_MIN_WIDTH,
  });
  const effectiveSideMenuMode = resolveEffectiveSideMenuMode({
    preferredMode: preferences.sideMenuMode,
    canUseFixedSideMenu: canUsePersistentSidebar,
  });
  const isPersistentSidebar = effectiveSideMenuMode === "fixed";
  const isSidebarVisible = menuOpen || isPersistentSidebar;
  const isPwaManagementRoute = ["/pwa", "/install", "/uninstall"].some((route) =>
    pathname.startsWith(route)
  );

  const title = useMemo(
    () => titleOverride ?? resolveAppMenuTitle(pathname),
    [pathname, titleOverride]
  );

  useEffect(() => {
    void initAuthStore();
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/(auth)/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (isPersistentSidebar && menuOpen) {
      setMenuOpen(false);
    }
  }, [isPersistentSidebar, menuOpen]);

  function navigateTo(href: string) {
    router.push(href as never);
    setMenuOpen(false);
  }

  function toggleFixedSidebar() {
    void setSideMenuMode(isPersistentSidebar ? "overlay" : "fixed");
  }

  function toggleRoutineLayoutAuto() {
    void setRoutineLayoutMode(preferences.routineLayoutMode === "auto" ? "single" : "auto");
  }

  function toggleRoutineAdapted() {
    void setRoutineDisplayMode(
      preferences.routineDisplayMode === "adapted" ? "regular" : "adapted"
    );
  }

  const sideMenuContent = (
    <AppSideMenuContent
      pathname={pathname}
      onNavigate={navigateTo}
      onClose={() => setMenuOpen(false)}
      showCloseButton={!isPersistentSidebar}
      canToggleFixedSidebar={canUsePersistentSidebar}
      fixedSidebarEnabled={isPersistentSidebar}
      onToggleFixedSidebar={toggleFixedSidebar}
      pwaMenuHref={pwaTargetHref(menuPwaTarget)}
      pwaMenuLabel={menuPwaLabel}
      showPwaMenuItem={isInstallPromotionVisible}
      routineLayoutAutoEnabled={preferences.routineLayoutMode === "auto"}
      onToggleRoutineLayoutAuto={toggleRoutineLayoutAuto}
      routineAdaptedEnabled={preferences.routineDisplayMode === "adapted"}
      onToggleRoutineAdapted={toggleRoutineAdapted}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <View
        style={[
          { flex: 1, minHeight: 0, backgroundColor: Colors.white },
          isPersistentSidebar ? webDesktopContentStyle : null,
        ]}
      >
        {/* <SafeAreaView edges={["top"]} style={{ backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.grey }}> */}
        <SafeAreaView edges={["top"]} style={{ backgroundColor: Colors.white }}>
          {isPwaManagementRoute ? null : <PwaGlobalPrompts />}
          <View
            style={{
              minHeight: 40,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            {left ? (
              <View style={{ width: HEADER_MENU_ICON_SIZE, height: HEADER_MENU_ICON_SIZE }}>
                {left}
              </View>
            ) : !isPersistentSidebar ? (
              <Pressable
                accessibilityLabel={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                accessibilityRole="button"
                onPress={() => setMenuOpen((open) => !open)}
                style={{
                  width: HEADER_MENU_ICON_SIZE,
                  height: HEADER_MENU_ICON_SIZE,
                  borderRadius: 21,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: withAlpha(Colors.primary, 0.09),
                  borderWidth: 1,
                  borderColor: withAlpha(Colors.primary, 0.25),
                }}
              >
                <AppIcon name={menuOpen ? "close" : "menu"} />
              </Pressable>
            ) : null}
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                color: Colors.black,
                fontSize: 19,
                fontFamily: "Fredoka_700Bold",
              }}
            >
              {title}
            </Text>
            {right ? <View style={{ flexShrink: 0 }}>{right}</View> : null}
          </View>
          {secondary ? (
            <View style={{ paddingHorizontal: 16, paddingBottom: 2 }}>{secondary}</View>
          ) : null}
        </SafeAreaView>

        <View style={{ flex: 1, minHeight: 0 }}>
          <Slot />
        </View>
      </View>

      {isSidebarVisible ? (
        <>
          {!isPersistentSidebar ? (
            <Pressable
              accessibilityLabel="Fermer le menu"
              onPress={() => setMenuOpen(false)}
              style={[
                Platform.OS === "web" ? webBackdropStyle : nativeBackdropStyle,
                { backgroundColor: withAlpha(Colors.black, 0.42) },
              ]}
            />
          ) : null}
          <SafeAreaView
            edges={["top", "bottom"]}
            style={[
              Platform.OS === "web" ? webSidebarStyle : nativeSidebarStyle,
              {
                backgroundColor: Colors.white,
                borderRightWidth: 1,
                borderRightColor: Colors.grey,
              },
            ]}
          >
            {Platform.OS === "web" ? (
              sideMenuContent
            ) : (
              <ScrollView
                style={{ flex: 1, minHeight: 0 }}
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
              >
                {sideMenuContent}
              </ScrollView>
            )}
          </SafeAreaView>
        </>
      ) : null}
    </View>
  );
}

function pwaTargetHref(target: ReturnType<typeof usePwa>["menuPwaTarget"]): string {
  switch (target) {
    case "install":
      return "/(app)/install";
    case "uninstall":
      return "/(app)/uninstall";
    default:
      return "/(app)/pwa";
  }
}

export default function AppLayout() {
  return (
    <AppHeaderControlsProvider>
      <LayoutPreferencesProvider>
        <AppLayoutShell />
      </LayoutPreferencesProvider>
    </AppHeaderControlsProvider>
  );
}
