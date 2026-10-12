import { Image, type ImageStyle, type StyleProp } from "react-native";
import arrowDownIconSource from "@assets/icons/arrow-down.svg";
import arrowUpIconSource from "@assets/icons/arrow-up.svg";
import backIconSource from "@assets/icons/back.svg";
import chevronLeftIconSource from "@assets/icons/chevron-left.svg";
import chevronRightIconSource from "@assets/icons/chevron-right.svg";
import closeIconSource from "@assets/icons/close.svg";
import editIconSource from "@assets/icons/edit.svg";
import menuIconSource from "@assets/icons/menu.svg";
import plusIconSource from "@assets/icons/plus.svg";
import rewardIconSource from "@assets/icons/reward.svg";
import starIconSource from "@assets/icons/star.svg";
import trashIconSource from "@assets/icons/trash.svg";

export const APP_ICON_SOURCES = {
  "arrow-down": arrowDownIconSource,
  "arrow-up": arrowUpIconSource,
  back: backIconSource,
  "chevron-left": chevronLeftIconSource,
  "chevron-right": chevronRightIconSource,
  close: closeIconSource,
  edit: editIconSource,
  menu: menuIconSource,
  plus: plusIconSource,
  reward: rewardIconSource,
  star: starIconSource,
  trash: trashIconSource,
} as const;

export type AppIconName = keyof typeof APP_ICON_SOURCES;

type AppIconProps = {
  name: AppIconName;
  size?: number;
  tintColor?: string;
  style?: StyleProp<ImageStyle>;
};

export function AppIcon({ name, size = 22, tintColor, style }: AppIconProps) {
  return (
    <Image
      accessibilityIgnoresInvertColors
      resizeMode="contain"
      source={APP_ICON_SOURCES[name]}
      style={[{ height: size, width: size, tintColor }, style]}
    />
  );
}
