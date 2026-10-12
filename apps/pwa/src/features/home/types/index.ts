import type { MomentKind } from "@shared/db";
import type { ProfileColorSet } from "@shared/utils/colorUtils";

export type { MomentKind };
export type { ProfileColorSet };

export interface TaskVM {
  id: string;
  pivotId: string;
  name: string;
  label?: string;
  stars: number;
  checked: boolean;
  stickerKey: string | null;
}

export interface ActivityVM {
  id: string;
  pivotId: string;
  name: string;
  label?: string;
  icon?: string;       // Material Symbol name (ex: "restaurant")
  stars: number;
  checked: boolean;
  /** Sticker configure dans le Builder (source unique pour fait/à faire). */
  pendingStickerKey: string;
  tasks: TaskVM[];
  completedTasks: number;
  totalTasks: number;
}

export interface MomentVM {
  id: string;
  pivotId: string;
  kind: MomentKind;
  name: string;
  label?: string;
  /** Récapitulatif d'étoiles du moment (ne rapporte jamais directement). */
  stars: number;
  checked: boolean;
  activities: ActivityVM[];
  completedActivities: number;
  totalActivities: number;
  completedTasks: number;
  totalTasks: number;
}

export interface HomeRoutineVM {
  profileId: string;
  profileName: string;
  /** Les 4 couleurs du profil (2 base + 2 pastel auto-générées) */
  colors: ProfileColorSet;
  balance: number;
  todayStars: number;
  moments: MomentVM[];
  totalCompleted: number;
  totalItems: number;
  progressPercent: number;
  isDayValidated: boolean;
}
