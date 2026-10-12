export type LayoutViewportPlatform = "web" | "native";
export type SideMenuMode = "fixed" | "overlay";
export type RoutineLayoutMode = "single" | "auto";
export type RoutineDisplayMode = "regular" | "adapted";

export interface LayoutPreferences {
  sideMenuMode: SideMenuMode;
  routineLayoutMode: RoutineLayoutMode;
  routineDisplayMode: RoutineDisplayMode;
}

export interface LayoutViewportContext {
  platform: LayoutViewportPlatform;
  userAgent?: string | null;
}

export const DEFAULT_LAYOUT_PREFERENCES: LayoutPreferences = {
  sideMenuMode: "fixed",
  routineLayoutMode: "single",
  routineDisplayMode: "regular",
};

export const FIXED_SIDE_MENU_MIN_WIDTH = 1024;
export const LAYOUT_SMARTPHONE_MAX_WIDTH = 500;
export const ROUTINE_REGULAR_COLUMN_MIN_WIDTH = 320;
export const ROUTINE_ADAPTED_COLUMN_MIN_WIDTH = 540;

const PHONE_USER_AGENT_REGEX = /Android.+Mobile|iPhone|iPod|Windows Phone|Mobile/i;
const TABLET_USER_AGENT_REGEX = /iPad|Tablet|Nexus 7|Nexus 10|Silk/i;

export function isSmartphoneLayoutViewportByContext(
  width: number,
  context: LayoutViewportContext
): boolean {
  if (!Number.isFinite(width) || width <= 0) return false;
  if (Math.round(width) > LAYOUT_SMARTPHONE_MAX_WIDTH) return false;
  if (context.platform !== "web") return true;

  const userAgent = context.userAgent ?? "";
  if (TABLET_USER_AGENT_REGEX.test(userAgent)) return false;
  return PHONE_USER_AGENT_REGEX.test(userAgent);
}

export function canUseFixedSideMenuByContext({
  width,
  context,
  desktopBreakpoint,
}: {
  width: number;
  context: LayoutViewportContext;
  desktopBreakpoint: number;
}): boolean {
  if (context.platform !== "web") return false;
  if (!Number.isFinite(width) || Math.round(width) < desktopBreakpoint) return false;
  return !isSmartphoneLayoutViewportByContext(width, context);
}

export function resolveEffectiveSideMenuMode({
  preferredMode,
  canUseFixedSideMenu,
}: {
  preferredMode: SideMenuMode;
  canUseFixedSideMenu: boolean;
}): SideMenuMode {
  if (!canUseFixedSideMenu) return "overlay";
  return preferredMode === "fixed" ? "fixed" : "overlay";
}

export function resolveRoutineColumnCount({
  profileCount,
  containerWidth,
  isSmartphone,
  routineLayoutMode,
  minColumnWidth = ROUTINE_REGULAR_COLUMN_MIN_WIDTH,
}: {
  profileCount: number;
  containerWidth: number;
  isSmartphone: boolean;
  routineLayoutMode: RoutineLayoutMode;
  minColumnWidth?: number;
}): number {
  if (!Number.isInteger(profileCount) || profileCount <= 0) return 0;
  if (isSmartphone || routineLayoutMode === "single") return 1;
  if (!Number.isFinite(containerWidth) || containerWidth <= 0) return 1;

  const columnsByWidth = Math.max(1, Math.floor(containerWidth / minColumnWidth));
  return Math.max(1, Math.min(profileCount, columnsByWidth));
}

export function resolveRoutineColumnMinWidth({ adapted }: { adapted: boolean }): number {
  return adapted ? ROUTINE_ADAPTED_COLUMN_MIN_WIDTH : ROUTINE_REGULAR_COLUMN_MIN_WIDTH;
}

export function resolveRoutineCompactLayout({
  isSmartphone,
  routineDisplayMode,
}: {
  isSmartphone: boolean;
  routineDisplayMode: RoutineDisplayMode;
}): boolean {
  if (isSmartphone) return true;
  return routineDisplayMode === "regular";
}

export function normalizeLayoutPreferences(input: unknown): LayoutPreferences {
  if (!input || typeof input !== "object") return { ...DEFAULT_LAYOUT_PREFERENCES };

  const candidate = input as Partial<
    Record<keyof LayoutPreferences | "routineCompactMode", unknown>
  >;
  const sideMenuMode: SideMenuMode =
    candidate.sideMenuMode === "overlay" || candidate.sideMenuMode === "fixed"
      ? candidate.sideMenuMode
      : DEFAULT_LAYOUT_PREFERENCES.sideMenuMode;
  const routineLayoutMode: RoutineLayoutMode =
    candidate.routineLayoutMode === "auto" || candidate.routineLayoutMode === "single"
      ? candidate.routineLayoutMode
      : DEFAULT_LAYOUT_PREFERENCES.routineLayoutMode;
  const routineDisplayMode: RoutineDisplayMode =
    candidate.routineDisplayMode === "adapted" || candidate.routineDisplayMode === "regular"
      ? candidate.routineDisplayMode
      : candidate.routineCompactMode === "regular"
        ? "adapted"
        : DEFAULT_LAYOUT_PREFERENCES.routineDisplayMode;

  return {
    sideMenuMode,
    routineLayoutMode,
    routineDisplayMode,
  };
}
