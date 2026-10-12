import type { ReactNode } from "react";
import { Pressable, Switch, View, type ViewStyle } from "react-native";
import { AppIcon, Text } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import { CHILD_MENU_ITEMS, PARENT_MENU_ITEMS, type AppMenuItem } from "./menuItems";

export const APP_SIDEBAR_WIDTH = 292;

const SIDEBAR_ITEM_ICON_SIZE = 24;

export const webSidebarStyle = {
  bottom: 0,
  boxSizing: "border-box",
  left: 0,
  maxHeight: "100vh",
  maxWidth: "86vw",
  overflowX: "hidden",
  overflowY: "auto",
  position: "fixed",
  top: 0,
  width: APP_SIDEBAR_WIDTH,
  zIndex: 50,
} as unknown as ViewStyle;

export const nativeSidebarStyle: ViewStyle = {
  bottom: 0,
  left: 0,
  maxWidth: "86%",
  position: "absolute",
  top: 0,
  width: APP_SIDEBAR_WIDTH,
  zIndex: 50,
};

export const webDesktopContentStyle = {
  boxSizing: "border-box",
  maxWidth: "100%",
  overflowX: "hidden",
  paddingLeft: APP_SIDEBAR_WIDTH,
  width: "100%",
} as unknown as ViewStyle;

function SectionLabel({ label }: { label: string }) {
  return (
    <Text
      style={{
        fontSize: 11,
        fontFamily: "Fredoka_600SemiBold",
        color: Colors.primary,
        textTransform: "uppercase",
        letterSpacing: 1.2,
      }}
    >
      {label}
    </Text>
  );
}

function SideMenuSection({
  label,
  children,
  bottomBorder = false,
}: {
  label: string;
  children: ReactNode;
  bottomBorder?: boolean;
}) {
  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: Colors.grey,
        borderBottomWidth: bottomBorder ? 1 : 0,
        borderBottomColor: Colors.grey,
        gap: 12,
        paddingTop: 16,
        paddingBottom: 16,
      }}
    >
      <SectionLabel label={label} />
      {children}
    </View>
  );
}

function MenuItemButton({
  item,
  pathname,
  onNavigate,
}: {
  item: AppMenuItem;
  pathname: string;
  onNavigate: (href: string) => void;
}) {
  const active = item.match(pathname);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onNavigate(item.href)}
      style={{
        minHeight: 48,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: active ? withAlpha(Colors.primary, 0.36) : Colors.grey,
        backgroundColor: active ? withAlpha(Colors.primary, 0.1) : Colors.white,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 12,
      }}
    >
      <Text
        style={{
          width: SIDEBAR_ITEM_ICON_SIZE,
          height: SIDEBAR_ITEM_ICON_SIZE,
          lineHeight: SIDEBAR_ITEM_ICON_SIZE,
          textAlign: "center",
          textAlignVertical: "center",
          fontSize: 19,
        }}
      >
        {item.icon}
      </Text>
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          color: active ? Colors.primary : Colors.black,
          fontSize: 14,
          fontFamily: "Fredoka_700Bold",
        }}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

function MenuItemList({
  items,
  pathname,
  onNavigate,
}: {
  items: AppMenuItem[];
  pathname: string;
  onNavigate: (href: string) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      {items.map((item) => (
        <MenuItemButton key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
      ))}
    </View>
  );
}

function OptionSwitchRow({
  title,
  accessibilityLabel,
  value,
  onToggle,
}: {
  title: string;
  accessibilityLabel: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text
          numberOfLines={1}
          style={{
            color: Colors.black,
            fontSize: 14,
            fontFamily: "Fredoka_700Bold",
          }}
        >
          {title}
        </Text>
      </View>
      <Switch
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="switch"
        onValueChange={onToggle}
        thumbColor={value ? Colors.primary : Colors.white}
        trackColor={{
          false: Colors.grey,
          true: withAlpha(Colors.primary, 0.45),
        }}
        value={value}
      />
    </View>
  );
}

export function AppSideMenuContent({
  pathname,
  onNavigate,
  onClose,
  showCloseButton,
  canToggleFixedSidebar,
  fixedSidebarEnabled,
  onToggleFixedSidebar,
  pwaMenuHref,
  pwaMenuLabel,
  showPwaMenuItem,
  routineLayoutAutoEnabled,
  onToggleRoutineLayoutAuto,
  routineAdaptedEnabled,
  onToggleRoutineAdapted,
}: {
  pathname: string;
  onNavigate: (href: string) => void;
  onClose?: () => void;
  showCloseButton: boolean;
  canToggleFixedSidebar: boolean;
  fixedSidebarEnabled: boolean;
  onToggleFixedSidebar: () => void;
  pwaMenuHref: string;
  pwaMenuLabel: string;
  showPwaMenuItem: boolean;
  routineLayoutAutoEnabled: boolean;
  onToggleRoutineLayoutAuto: () => void;
  routineAdaptedEnabled: boolean;
  onToggleRoutineAdapted: () => void;
}) {
  const pwaMenuItem: AppMenuItem = {
    label: pwaMenuLabel,
    icon: "📲",
    href: pwaMenuHref,
    match: (currentPathname) =>
      ["/pwa", "/install", "/uninstall"].some((route) => currentPathname.startsWith(route)),
  };

  return (
    <View
      style={{
        minHeight: "100%",
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 20,
        gap: 22,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text style={{ fontSize: 25, fontFamily: "Fredoka_700Bold", color: Colors.black }}>
            Maroutine
          </Text>
          <SectionLabel label="Menu" />
        </View>
        {showCloseButton ? (
          <Pressable
            accessibilityLabel="Fermer le menu"
            accessibilityRole="button"
            onPress={onClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: withAlpha(Colors.black, 0.06),
              borderWidth: 1,
              borderColor: Colors.grey,
            }}
          >
            <AppIcon name="close" />
          </Pressable>
        ) : null}
      </View>

      <SideMenuSection label="Enfants">
        <MenuItemList items={CHILD_MENU_ITEMS} pathname={pathname} onNavigate={onNavigate} />
      </SideMenuSection>

      <SideMenuSection label="Parents">
        <MenuItemList items={PARENT_MENU_ITEMS} pathname={pathname} onNavigate={onNavigate} />
      </SideMenuSection>

      <View style={{ marginTop: "auto", gap: 16 }}>
        {showPwaMenuItem ? (
          <MenuItemButton item={pwaMenuItem} pathname={pathname} onNavigate={onNavigate} />
        ) : null}

        <SideMenuSection label="Options" bottomBorder>
          {canToggleFixedSidebar ? (
            <OptionSwitchRow
              title="Menu ancré"
              accessibilityLabel="Basculer l'ancrage du menu"
              value={fixedSidebarEnabled}
              onToggle={onToggleFixedSidebar}
            />
          ) : null}
          <OptionSwitchRow
            title="Affichage multi routines"
            accessibilityLabel="Basculer l'affichage multi routines"
            value={routineLayoutAutoEnabled}
            onToggle={onToggleRoutineLayoutAuto}
          />
          <OptionSwitchRow
            title="Affichage adapté"
            accessibilityLabel="Basculer l'affichage adapté des routines"
            value={routineAdaptedEnabled}
            onToggle={onToggleRoutineAdapted}
          />
        </SideMenuSection>
      </View>
    </View>
  );
}
