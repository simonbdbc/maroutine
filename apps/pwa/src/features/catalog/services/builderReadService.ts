import { supabase } from "@shared/db";
import { listMoments, listActivities, listTasks } from "./catalogRepo";
import { DEFAULT_STICKER_KEY } from "../../stickers/registry";
import type {
  ProfileRoutineDraft,
  BuilderMomentVm,
  BuilderActivityVm,
  BuilderTaskVm,
  CatalogMoment,
  CatalogActivity,
  CatalogTask,
} from "../types";

function resolveStickerKey(stickerKey: string | null): string {
  const normalized = stickerKey?.trim();
  return normalized ? normalized : DEFAULT_STICKER_KEY;
}

type LegacyMomentRow = {
  id: string;
  name: string;
  kind: CatalogMoment["kind"];
  label: string | null;
  default_stars: number;
  sort_index: number;
};

type LegacyActivityRow = {
  id: string;
  name: string;
  label: string | null;
  icon: string | null;
  default_stars: number;
  sort_index: number;
};

type LegacyTaskRow = {
  id: string;
  name: string;
  label: string | null;
  default_stars: number;
  sort_index: number;
};

function legacyMomentKey(row: Pick<CatalogMoment, "kind" | "sortIndex">): string {
  return `${row.kind}:${row.sortIndex}`;
}

function legacyActivityKey(row: Pick<CatalogActivity, "sortIndex">): string {
  return String(row.sortIndex);
}

function legacyTaskKey(row: Pick<CatalogTask, "sortIndex">): string {
  return String(row.sortIndex);
}

function toCatalogMoment(row: LegacyMomentRow): CatalogMoment {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    label: row.label,
    defaultStars: row.default_stars,
    sortIndex: row.sort_index,
  };
}

function toCatalogActivity(row: LegacyActivityRow): CatalogActivity {
  return {
    id: row.id,
    name: row.name,
    label: row.label,
    icon: row.icon,
    defaultStars: row.default_stars,
    sortIndex: row.sort_index,
  };
}

function toCatalogTask(row: LegacyTaskRow): CatalogTask {
  return {
    id: row.id,
    name: row.name,
    label: row.label,
    defaultStars: row.default_stars,
    sortIndex: row.sort_index,
  };
}

export async function readRoutineCatalog(): Promise<ProfileRoutineDraft["catalog"]> {
  const [moments, activities, tasks] = await Promise.all([
    listMoments(), listActivities(), listTasks(),
  ]);

  return { moments, activities, tasks };
}

/**
 * Charge la routine configurée d'un profil + le catalogue disponible.
 * Retourne un `ProfileRoutineDraft` prêt à être édité en mémoire.
 */
export async function readProfileRoutineDraft(
  profileId: string
): Promise<ProfileRoutineDraft> {
  // 1. Catalogue du compte
  const { moments, activities, tasks } = await readRoutineCatalog();
  const ownedMomentByLegacyKey = new Map(moments.map((moment) => [legacyMomentKey(moment), moment]));
  const ownedActivityByLegacyKey = new Map(activities.map((activity) => [legacyActivityKey(activity), activity]));
  const ownedTaskByLegacyKey = new Map(tasks.map((task) => [legacyTaskKey(task), task]));

  // 2. Pivots du profil : moments
  const { data: pmRows, error: pmErr } = await supabase
    .from("profile_moments")
    .select("id, moment_id, stars, sort_index")
    .eq("profile_id", profileId)
    .order("sort_index", { ascending: true });
  if (pmErr) throw new Error(pmErr.message);

  const pmIds = (pmRows ?? []).map((r) => r.id);

  // 3. Pivots : activités
  let pmaRows: {
    id: string;
    profile_moment_id: string;
    activity_id: string;
    stars: number;
    sticker_key: string | null;
    sort_index: number;
  }[] = [];
  if (pmIds.length > 0) {
    const { data, error } = await supabase
      .from("profile_moment_activities")
      .select("id, profile_moment_id, activity_id, stars, sticker_key, sort_index")
      .in("profile_moment_id", pmIds)
      .order("sort_index", { ascending: true });
    if (error) throw new Error(error.message);
    pmaRows = data ?? [];
  }

  const pmaIds = pmaRows.map((r) => r.id);

  // 4. Pivots : tâches
  let pmatRows: { id: string; profile_moment_activity_id: string; task_id: string; stars: number; sort_index: number }[] = [];
  if (pmaIds.length > 0) {
    const { data, error } = await supabase
      .from("profile_moment_activity_tasks")
      .select("id, profile_moment_activity_id, task_id, stars, sort_index")
      .in("profile_moment_activity_id", pmaIds)
      .order("sort_index", { ascending: true });
    if (error) throw new Error(error.message);
    pmatRows = data ?? [];
  }

  const missingMomentIds = Array.from(new Set(
    (pmRows ?? []).map((row) => row.moment_id).filter((id) => !moments.some((moment) => moment.id === id))
  ));
  const missingActivityIds = Array.from(new Set(
    pmaRows.map((row) => row.activity_id).filter((id) => !activities.some((activity) => activity.id === id))
  ));
  const missingTaskIds = Array.from(new Set(
    pmatRows.map((row) => row.task_id).filter((id) => !tasks.some((task) => task.id === id))
  ));

  let legacyMoments: LegacyMomentRow[] = [];
  let legacyActivities: LegacyActivityRow[] = [];
  let legacyTasks: LegacyTaskRow[] = [];

  if (missingMomentIds.length > 0) {
    const { data, error } = await supabase
      .from("moments")
      .select("id, name, kind, label, default_stars, sort_index")
      .in("id", missingMomentIds);
    if (error) throw new Error(error.message);
    legacyMoments = data ?? [];
  }

  if (missingActivityIds.length > 0) {
    const { data, error } = await supabase
      .from("activities")
      .select("id, name, label, icon, default_stars, sort_index")
      .in("id", missingActivityIds);
    if (error) throw new Error(error.message);
    legacyActivities = data ?? [];
  }

  if (missingTaskIds.length > 0) {
    const { data, error } = await supabase
      .from("tasks")
      .select("id, name, label, default_stars, sort_index")
      .in("id", missingTaskIds);
    if (error) throw new Error(error.message);
    legacyTasks = data ?? [];
  }

  const momentMap = new Map<string, CatalogMoment>(moments.map((moment) => [moment.id, moment]));
  const activityMap = new Map<string, CatalogActivity>(activities.map((activity) => [activity.id, activity]));
  const taskMap = new Map<string, CatalogTask>(tasks.map((task) => [task.id, task]));

  for (const legacyMoment of legacyMoments) {
    const ownedMoment = ownedMomentByLegacyKey.get(legacyMomentKey({
      kind: legacyMoment.kind,
      sortIndex: legacyMoment.sort_index,
    }));
    momentMap.set(legacyMoment.id, ownedMoment ?? toCatalogMoment(legacyMoment));
  }

  for (const legacyActivity of legacyActivities) {
    const ownedActivity = ownedActivityByLegacyKey.get(legacyActivityKey({
      sortIndex: legacyActivity.sort_index,
    }));
    activityMap.set(legacyActivity.id, ownedActivity ?? toCatalogActivity(legacyActivity));
  }

  for (const legacyTask of legacyTasks) {
    const ownedTask = ownedTaskByLegacyKey.get(legacyTaskKey({
      sortIndex: legacyTask.sort_index,
    }));
    taskMap.set(legacyTask.id, ownedTask ?? toCatalogTask(legacyTask));
  }

  // 5. Grouper tâches par activité pivot
  const tasksByPma = new Map<string, typeof pmatRows>();
  for (const t of pmatRows) {
    const bucket = tasksByPma.get(t.profile_moment_activity_id) ?? [];
    bucket.push(t);
    tasksByPma.set(t.profile_moment_activity_id, bucket);
  }

  // 6. Grouper activités par moment pivot
  const activitiesByPm = new Map<string, typeof pmaRows>();
  for (const a of pmaRows) {
    const bucket = activitiesByPm.get(a.profile_moment_id) ?? [];
    bucket.push(a);
    activitiesByPm.set(a.profile_moment_id, bucket);
  }

  // 7. Construire le draft
  const builderMoments: BuilderMomentVm[] = (pmRows ?? []).map((pm) => {
    const catalog = momentMap.get(pm.moment_id);
    const pmActivities = activitiesByPm.get(pm.id) ?? [];

    const builderActivities: BuilderActivityVm[] = pmActivities.map((pma) => {
      const catActivity = activityMap.get(pma.activity_id);
      const pmaTasks = tasksByPma.get(pma.id) ?? [];

      const builderTasks: BuilderTaskVm[] = pmaTasks.map((pmat) => {
        const catTask = taskMap.get(pmat.task_id);
        return {
          linkId: pmat.id,
          taskId: catTask?.id ?? pmat.task_id,
          taskName: catTask?.name ?? "(tâche inconnue)",
          stars: pmat.stars,
          sortIndex: pmat.sort_index,
        };
      });

      return {
        linkId: pma.id,
        activityId: catActivity?.id ?? pma.activity_id,
        activityName: catActivity?.name ?? "(activité inconnue)",
        activityIcon: catActivity?.icon ?? null,
        stars: pma.stars,
        stickerKey: resolveStickerKey(pma.sticker_key),
        sortIndex: pma.sort_index,
        tasks: builderTasks,
      };
    });

    return {
      linkId: pm.id,
      momentId: catalog?.id ?? pm.moment_id,
      momentName: catalog?.name ?? "(moment inconnu)",
      stars: pm.stars,
      sortIndex: pm.sort_index,
      activities: builderActivities,
    };
  });

  return {
    profileId,
    moments: builderMoments,
    catalog: { moments, activities, tasks },
  };
}
