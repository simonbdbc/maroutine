import { resolveProfileColors } from "../../../shared/utils/colorUtils";
import type { DailyCheckTargetType } from "../../../shared/db/supabaseTypes";
import type { HomeRoutineVM, MomentVM, ActivityVM, TaskVM } from "../types";
import { DEFAULT_STICKER_KEY } from "../../stickers/registry";
import { Colors } from "@shared/theme";

function resolveActivityStickerKey(stickerKey: string | null): string {
  const normalized = stickerKey?.trim();
  return normalized ? normalized : DEFAULT_STICKER_KEY;
}

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

function resolveRoutineProfileColors(profile: RoutineProfileRow) {
  const primary = HEX_COLOR_REGEX.test(profile.primary_color)
    ? profile.primary_color
    : Colors.primary;
  const secondary = HEX_COLOR_REGEX.test(profile.secondary_color)
    ? profile.secondary_color
    : Colors.secondary;

  return resolveProfileColors(primary, secondary);
}

export interface TaskJoinRow {
  id: string;
  stars: number;
  sort_index: number;
  tasks: {
    id: string;
    name: string;
    label: string | null;
    sort_index: number;
  } | null;
}

export interface ActivityJoinRow {
  id: string;
  stars: number;
  sticker_key: string | null;
  sort_index: number;
  activities: {
    id: string;
    name: string;
    label: string | null;
    icon: string | null;
    sort_index: number;
  } | null;
  profile_moment_activity_tasks: TaskJoinRow[] | null;
}

export interface ProfileMomentJoinRow {
  id: string;
  stars: number;
  sort_index: number;
  moments: {
    id: string;
    name: string;
    kind: MomentVM["kind"];
    label: string | null;
    sort_index: number;
  } | null;
  profile_moment_activities: ActivityJoinRow[] | null;
}

export interface RoutineProfileRow {
  id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  balance: number;
}

export interface RoutineDailyCheckRow {
  target_type: DailyCheckTargetType;
  profile_moment_activity_id: string | null;
  profile_moment_activity_task_id: string | null;
  checked: boolean;
  sticker_key: string | null;
  stars_earned: number;
}

export interface RoutineValidationRow {
  earned_stars: number;
}

interface BuildHomeRoutineVmArgs {
  profile: RoutineProfileRow;
  profileMomentRows: ProfileMomentJoinRow[];
  checks: RoutineDailyCheckRow[];
  validation: RoutineValidationRow | null;
}

function sortRowsByIndex<T extends { sort_index: number }>(rows: T[]): T[] {
  return [...rows].sort((left, right) => left.sort_index - right.sort_index);
}

export function buildHomeRoutineVm({
  profile,
  profileMomentRows,
  checks,
  validation,
}: BuildHomeRoutineVmArgs): HomeRoutineVM {
  const taskChecks = new Map<string, RoutineDailyCheckRow>();
  const activityChecks = new Map<string, RoutineDailyCheckRow>();

  for (const check of checks) {
    if (!check.checked) continue;

    if (check.target_type === "task" && check.profile_moment_activity_task_id) {
      taskChecks.set(check.profile_moment_activity_task_id, check);
      continue;
    }

    if (check.target_type === "activity" && check.profile_moment_activity_id) {
      activityChecks.set(check.profile_moment_activity_id, check);
    }
  }

  let totalCompleted = 0;
  let totalItems = 0;
  let todayStars = 0;

  const moments: MomentVM[] = sortRowsByIndex(profileMomentRows).map((profileMoment) => {
    const moment = profileMoment.moments;
    if (!moment) {
      throw new Error("Donnée invalide: moment manquant");
    }

    const activityRows = sortRowsByIndex(profileMoment.profile_moment_activities ?? []);
    const activities: ActivityVM[] = activityRows.map((profileMomentActivity) => {
      const activity = profileMomentActivity.activities;
      if (!activity) {
        throw new Error("Donnée invalide: activité manquante");
      }

      const activityCheck = activityChecks.get(profileMomentActivity.id);
      const taskRows = sortRowsByIndex(
        profileMomentActivity.profile_moment_activity_tasks ?? []
      );
      const tasks: TaskVM[] = taskRows.map((profileMomentActivityTask) => {
        const task = profileMomentActivityTask.tasks;
        if (!task) {
          throw new Error("Donnée invalide: tâche manquante");
        }

        const taskCheck = taskChecks.get(profileMomentActivityTask.id);
        const checked = taskCheck?.checked ?? false;
        const stars = profileMomentActivityTask.stars;
        const taskVm: TaskVM = {
          id: task.id,
          pivotId: profileMomentActivityTask.id,
          name: task.name,
          stars,
          checked,
          stickerKey: taskCheck?.sticker_key ?? null,
        };
        if (task.label) {
          taskVm.label = task.label;
        }
        return taskVm;
      });

      const completedTasks = tasks.filter((task) => task.checked).length;
      const hasTasks = tasks.length > 0;
      const checked = hasTasks
        ? completedTasks === tasks.length
        : (activityCheck?.checked ?? false);

      if (hasTasks) {
        totalItems += tasks.length;
        totalCompleted += completedTasks;

        for (const task of tasks) {
          if (!task.checked) continue;
          const taskCheck = taskChecks.get(task.pivotId);
          todayStars += taskCheck?.stars_earned ?? task.stars;
        }
      } else {
        totalItems += 1;
        if (checked) {
          totalCompleted += 1;
          todayStars += activityCheck?.stars_earned ?? profileMomentActivity.stars;
        }
      }

      const activityStars = hasTasks
        ? tasks.reduce((sum, task) => sum + task.stars, 0)
        : profileMomentActivity.stars;

      const activityVm: ActivityVM = {
        id: activity.id,
        pivotId: profileMomentActivity.id,
        name: activity.name,
        stars: activityStars,
        checked,
        pendingStickerKey: resolveActivityStickerKey(profileMomentActivity.sticker_key),
        tasks,
        completedTasks,
        totalTasks: tasks.length,
      };
      if (activity.label) {
        activityVm.label = activity.label;
      }
      if (activity.icon) {
        activityVm.icon = activity.icon;
      }
      return activityVm;
    });

    const completedActivities = activities.filter((activity) => activity.checked).length;
    const checked = activities.length > 0 && completedActivities === activities.length;
    const completedTasks = activities.reduce((sum, activity) => sum + activity.completedTasks, 0);
    const totalTasks = activities.reduce((sum, activity) => sum + activity.totalTasks, 0);
    const momentStars = activities.reduce((sum, activity) => {
      if (activity.tasks.length > 0) {
        return sum + activity.tasks.reduce((acc, task) => acc + task.stars, 0);
      }
      return sum + activity.stars;
    }, 0);

    const momentVm: MomentVM = {
      id: moment.id,
      pivotId: profileMoment.id,
      kind: moment.kind,
      name: moment.name,
      stars: momentStars,
      checked,
      activities,
      completedActivities,
      totalActivities: activities.length,
      completedTasks,
      totalTasks,
    };
    if (moment.label) {
      momentVm.label = moment.label;
    }
    return momentVm;
  });

  const isDayValidated = Boolean(validation);
  const todayStarsFinal = isDayValidated
    ? (validation?.earned_stars ?? 0)
    : todayStars;

  return {
    profileId: profile.id,
    profileName: profile.name,
    colors: resolveRoutineProfileColors(profile),
    balance: profile.balance,
    todayStars: todayStarsFinal,
    moments,
    totalCompleted,
    totalItems,
    progressPercent: totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0,
    isDayValidated,
  } satisfies HomeRoutineVM;
}
