import type { ActivityVM, HomeRoutineVM, MomentVM, TaskVM } from "../types";

export type OptimisticToggleTarget =
  | {
      kind: "task";
      pivotTaskId: string;
      checked: boolean;
      stickerKey?: string | null;
    }
  | {
      kind: "activity";
      pivotActivityId: string;
      checked: boolean;
    };

export type OptimisticToggleLookupTarget =
  | { kind: "task"; pivotTaskId: string }
  | { kind: "activity"; pivotActivityId: string };

interface AggregateStats {
  totalItems: number;
  totalCompleted: number;
  todayStars: number;
}

interface RecomputeActivityResult {
  activity: ActivityVM;
  stats: AggregateStats;
}

interface RecomputeMomentResult {
  moment: MomentVM;
  stats: AggregateStats;
}

function recomputeActivity(activity: ActivityVM): RecomputeActivityResult {
  if (activity.tasks.length === 0) {
    const stars = activity.stars;
    const checked = activity.checked;
    return {
      activity: {
        ...activity,
        stars,
        completedTasks: 0,
        totalTasks: 0,
      },
      stats: {
        totalItems: 1,
        totalCompleted: checked ? 1 : 0,
        todayStars: checked ? stars : 0,
      },
    };
  }

  let completedTasks = 0;
  let todayStars = 0;

  const tasks = activity.tasks.map((task) => {
    if (task.checked) {
      completedTasks += 1;
      todayStars += task.stars;
    }

    return {
      ...task,
    };
  });

  const totalTasks = tasks.length;
  const checked = totalTasks > 0 && completedTasks === totalTasks;
  const stars = tasks.reduce((sum, task) => sum + task.stars, 0);

  return {
    activity: {
      ...activity,
      tasks,
      stars,
      checked,
      completedTasks,
      totalTasks,
    },
    stats: {
      totalItems: totalTasks,
      totalCompleted: completedTasks,
      todayStars,
    },
  };
}

function recomputeMoment(moment: MomentVM): RecomputeMomentResult {
  if (moment.activities.length === 0) {
    return {
      moment: {
        ...moment,
        stars: 0,
        checked: false,
        completedActivities: 0,
        totalActivities: 0,
        completedTasks: 0,
        totalTasks: 0,
      },
      stats: {
        totalItems: 0,
        totalCompleted: 0,
        todayStars: 0,
      },
    };
  }

  let completedActivities = 0;
  let completedTasks = 0;
  let totalTasks = 0;
  let totalItems = 0;
  let totalCompleted = 0;
  let todayStars = 0;
  let momentStars = 0;

  const activities = moment.activities.map((activity) => {
    const recomputed = recomputeActivity(activity);
    const nextActivity = recomputed.activity;

    if (nextActivity.checked) completedActivities += 1;
    completedTasks += nextActivity.completedTasks;
    totalTasks += nextActivity.totalTasks;
    momentStars += nextActivity.stars;

    totalItems += recomputed.stats.totalItems;
    totalCompleted += recomputed.stats.totalCompleted;
    todayStars += recomputed.stats.todayStars;

    return nextActivity;
  });

  const checked =
    activities.length > 0 && completedActivities === activities.length;

  return {
    moment: {
      ...moment,
      activities,
      stars: momentStars,
      checked,
      completedActivities,
      totalActivities: activities.length,
      completedTasks,
      totalTasks,
    },
    stats: {
      totalItems,
      totalCompleted,
      todayStars,
    },
  };
}

function patchTask(task: TaskVM, target: OptimisticToggleTarget): TaskVM {
  if (target.kind !== "task" || task.pivotId !== target.pivotTaskId) {
    return task;
  }

  const stickerKey = target.checked
    ? (target.stickerKey ?? task.stickerKey)
    : null;

  if (task.checked === target.checked && task.stickerKey === stickerKey) {
    return task;
  }

  return {
    ...task,
    checked: target.checked,
    stickerKey,
  };
}

function patchActivity(activity: ActivityVM, target: OptimisticToggleTarget): ActivityVM {
  if (target.kind !== "activity" || activity.pivotId !== target.pivotActivityId) {
    return activity;
  }

  if (activity.tasks.length === 0) {
    return {
      ...activity,
      checked: target.checked,
    };
  }

  const tasks = activity.tasks.map((task) => ({
    ...task,
    checked: target.checked,
    stickerKey: target.checked ? task.stickerKey : null,
  }));

  return {
    ...activity,
    checked: target.checked,
    tasks,
  };
}

function patchRoutine(routine: HomeRoutineVM, target: OptimisticToggleTarget): HomeRoutineVM {
  switch (target.kind) {
    case "task": {
      const moments = routine.moments.map((moment) => ({
        ...moment,
        activities: moment.activities.map((activity) => ({
          ...activity,
          tasks: activity.tasks.map((task) => patchTask(task, target)),
        })),
      }));
      return { ...routine, moments };
    }
    case "activity": {
      const moments = routine.moments.map((moment) => ({
        ...moment,
        activities: moment.activities.map((activity) => patchActivity(activity, target)),
      }));
      return { ...routine, moments };
    }
    default: {
      const exhaustive: never = target;
      return exhaustive;
    }
  }
}

export function recomputeRoutineAggregates(routine: HomeRoutineVM): HomeRoutineVM {
  let totalItems = 0;
  let totalCompleted = 0;
  let todayStars = 0;

  const moments = routine.moments.map((moment) => {
    const recomputed = recomputeMoment(moment);
    totalItems += recomputed.stats.totalItems;
    totalCompleted += recomputed.stats.totalCompleted;
    todayStars += recomputed.stats.todayStars;
    return recomputed.moment;
  });

  return {
    ...routine,
    moments,
    totalItems,
    totalCompleted,
    todayStars,
    progressPercent:
      totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0,
  };
}

export function applyOptimisticToggle(
  routine: HomeRoutineVM,
  target: OptimisticToggleTarget
): HomeRoutineVM {
  const patched = patchRoutine(routine, target);
  return recomputeRoutineAggregates(patched);
}

export function findToggleCurrentChecked(
  routine: HomeRoutineVM,
  target: OptimisticToggleLookupTarget
): boolean | null {
  switch (target.kind) {
    case "task": {
      for (const moment of routine.moments) {
        for (const activity of moment.activities) {
          const task = activity.tasks.find((candidate) => candidate.pivotId === target.pivotTaskId);
          if (task) return task.checked;
        }
      }
      return null;
    }
    case "activity": {
      for (const moment of routine.moments) {
        const activity = moment.activities.find((candidate) => candidate.pivotId === target.pivotActivityId);
        if (activity) return activity.checked;
      }
      return null;
    }
    default: {
      const exhaustive: never = target;
      return exhaustive;
    }
  }
}
