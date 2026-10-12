import type {
  ProfileRoutineDraft,
  BuilderMomentVm,
  BuilderActivityVm,
  BuilderTaskVm,
  CatalogMoment,
  CatalogActivity,
  CatalogTask,
} from "../types";
import { makeDraftLinkId } from "../types";
import { DEFAULT_STICKER_KEY } from "../../stickers/registry";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeStickerKey(stickerKey: string): string {
  const trimmed = stickerKey.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_STICKER_KEY;
}

function reindex<T extends { sortIndex: number }>(items: T[]): T[] {
  return items.map((item, i) => ({ ...item, sortIndex: i }));
}

function swap<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const copy = [...arr];
  const tmp = copy[from]!;
  copy[from] = copy[to]!;
  copy[to] = tmp;
  return copy;
}

// ─── Moment ops ───────────────────────────────────────────────────────────────

export function addMoment(
  draft: ProfileRoutineDraft,
  catalog: CatalogMoment
): ProfileRoutineDraft {
  if (draft.moments.some((moment) => moment.momentId === catalog.id)) {
    return draft;
  }

  const newMoment: BuilderMomentVm = {
    linkId: makeDraftLinkId("moment"),
    momentId: catalog.id,
    momentName: catalog.name,
    stars: catalog.defaultStars,
    sortIndex: draft.moments.length,
    activities: [],
  };
  return { ...draft, moments: [...draft.moments, newMoment] };
}

export function removeMoment(
  draft: ProfileRoutineDraft,
  linkId: string
): ProfileRoutineDraft {
  return {
    ...draft,
    moments: reindex(draft.moments.filter((m) => m.linkId !== linkId)),
  };
}

export function moveMoment(
  draft: ProfileRoutineDraft,
  linkId: string,
  direction: -1 | 1
): ProfileRoutineDraft {
  const idx = draft.moments.findIndex((m) => m.linkId === linkId);
  if (idx < 0) return draft;
  return {
    ...draft,
    moments: reindex(swap(draft.moments, idx, idx + direction)),
  };
}

// ─── Activity ops ─────────────────────────────────────────────────────────────

export function addActivity(
  draft: ProfileRoutineDraft,
  momentLinkId: string,
  catalog: CatalogActivity
): ProfileRoutineDraft {
  let changed = false;

  const moments = draft.moments.map((m) => {
      if (m.linkId !== momentLinkId) return m;
      if (m.activities.some((activity) => activity.activityId === catalog.id)) return m;

      changed = true;
      const newActivity: BuilderActivityVm = {
        linkId: makeDraftLinkId("activity"),
        activityId: catalog.id,
        activityName: catalog.name,
        activityIcon: catalog.icon,
        stars: catalog.defaultStars,
        stickerKey: DEFAULT_STICKER_KEY,
        sortIndex: m.activities.length,
        tasks: [],
      };
      return { ...m, activities: [...m.activities, newActivity] };
    });

  return changed ? { ...draft, moments } : draft;
}

export function removeActivity(
  draft: ProfileRoutineDraft,
  momentLinkId: string,
  activityLinkId: string
): ProfileRoutineDraft {
  return {
    ...draft,
    moments: draft.moments.map((m) => {
      if (m.linkId !== momentLinkId) return m;
      return {
        ...m,
        activities: reindex(m.activities.filter((a) => a.linkId !== activityLinkId)),
      };
    }),
  };
}

export function moveActivity(
  draft: ProfileRoutineDraft,
  momentLinkId: string,
  activityLinkId: string,
  direction: -1 | 1
): ProfileRoutineDraft {
  return {
    ...draft,
    moments: draft.moments.map((m) => {
      if (m.linkId !== momentLinkId) return m;
      const idx = m.activities.findIndex((a) => a.linkId === activityLinkId);
      if (idx < 0) return m;
      return {
        ...m,
        activities: reindex(swap(m.activities, idx, idx + direction)),
      };
    }),
  };
}

export function updateActivityStars(
  draft: ProfileRoutineDraft,
  momentLinkId: string,
  activityLinkId: string,
  stars: number
): ProfileRoutineDraft {
  return {
    ...draft,
    moments: draft.moments.map((m) => {
      if (m.linkId !== momentLinkId) return m;
      return {
        ...m,
        activities: m.activities.map((a) =>
          a.linkId === activityLinkId
            ? { ...a, stars: a.tasks.length > 0 ? 0 : stars }
            : a
        ),
      };
    }),
  };
}

export function updateActivitySticker(
  draft: ProfileRoutineDraft,
  momentLinkId: string,
  activityLinkId: string,
  stickerKey: string
): ProfileRoutineDraft {
  const normalized = normalizeStickerKey(stickerKey);
  return {
    ...draft,
    moments: draft.moments.map((m) => {
      if (m.linkId !== momentLinkId) return m;
      return {
        ...m,
        activities: m.activities.map((a) =>
          a.linkId === activityLinkId
            ? { ...a, stickerKey: normalized }
            : a
        ),
      };
    }),
  };
}

// ─── Task ops ─────────────────────────────────────────────────────────────────

export function addTask(
  draft: ProfileRoutineDraft,
  momentLinkId: string,
  activityLinkId: string,
  catalog: CatalogTask
): ProfileRoutineDraft {
  let changed = false;

  const moments = draft.moments.map((m) => {
      if (m.linkId !== momentLinkId) return m;
      return {
        ...m,
        activities: m.activities.map((a) => {
          if (a.linkId !== activityLinkId) return a;
          if (a.tasks.some((task) => task.taskId === catalog.id)) return a;

          changed = true;
          const isFirstTask = a.tasks.length === 0;
          const newTask: BuilderTaskVm = {
            linkId: makeDraftLinkId("task"),
            taskId: catalog.id,
            taskName: catalog.name,
            stars: catalog.defaultStars,
            sortIndex: a.tasks.length,
          };
          return {
            ...a,
            stars: isFirstTask ? 0 : a.stars,
            tasks: [...a.tasks, newTask],
          };
        }),
      };
    });

  return changed ? { ...draft, moments } : draft;
}

export function removeTask(
  draft: ProfileRoutineDraft,
  momentLinkId: string,
  activityLinkId: string,
  taskLinkId: string
): ProfileRoutineDraft {
  return {
    ...draft,
    moments: draft.moments.map((m) => {
      if (m.linkId !== momentLinkId) return m;
      return {
        ...m,
        activities: m.activities.map((a) => {
          if (a.linkId !== activityLinkId) return a;
          const nextTasks = a.tasks.filter((t) => t.linkId !== taskLinkId);
          return {
            ...a,
            tasks: reindex(nextTasks),
          };
        }),
      };
    }),
  };
}

export function moveTask(
  draft: ProfileRoutineDraft,
  momentLinkId: string,
  activityLinkId: string,
  taskLinkId: string,
  direction: -1 | 1
): ProfileRoutineDraft {
  return {
    ...draft,
    moments: draft.moments.map((m) => {
      if (m.linkId !== momentLinkId) return m;
      return {
        ...m,
        activities: m.activities.map((a) => {
          if (a.linkId !== activityLinkId) return a;
          const idx = a.tasks.findIndex((t) => t.linkId === taskLinkId);
          if (idx < 0) return a;
          return {
            ...a,
            tasks: reindex(swap(a.tasks, idx, idx + direction)),
          };
        }),
      };
    }),
  };
}

export function updateTaskStars(
  draft: ProfileRoutineDraft,
  momentLinkId: string,
  activityLinkId: string,
  taskLinkId: string,
  stars: number
): ProfileRoutineDraft {
  return {
    ...draft,
    moments: draft.moments.map((m) => {
      if (m.linkId !== momentLinkId) return m;
      return {
        ...m,
        activities: m.activities.map((a) => {
          if (a.linkId !== activityLinkId) return a;
          return {
            ...a,
            tasks: a.tasks.map((t) =>
              t.linkId === taskLinkId ? { ...t, stars } : t
            ),
          };
        }),
      };
    }),
  };
}

export function syncDraftCatalog(
  draft: ProfileRoutineDraft,
  catalog: ProfileRoutineDraft["catalog"]
): ProfileRoutineDraft {
  const momentMap = new Map(catalog.moments.map((moment) => [moment.id, moment]));
  const activityMap = new Map(catalog.activities.map((activity) => [activity.id, activity]));
  const taskMap = new Map(catalog.tasks.map((task) => [task.id, task]));

  return {
    ...draft,
    moments: draft.moments.map((moment) => {
      const nextMomentName = momentMap.get(moment.momentId)?.name ?? moment.momentName;

      return {
        ...moment,
        momentName: nextMomentName,
        activities: moment.activities.map((activity) => {
          const catalogActivity = activityMap.get(activity.activityId);
          const nextActivityName = catalogActivity?.name ?? activity.activityName;
          const nextActivityIcon = catalogActivity?.icon ?? activity.activityIcon;

          return {
            ...activity,
            activityName: nextActivityName,
            activityIcon: nextActivityIcon,
            tasks: activity.tasks.map((task) => ({
              ...task,
              taskName: taskMap.get(task.taskId)?.name ?? task.taskName,
            })),
          };
        }),
      };
    }),
    catalog,
  };
}
