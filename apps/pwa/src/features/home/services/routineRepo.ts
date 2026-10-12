import { supabase } from "@shared/db";
import type {
  ToggleTaskCheckReturn,
  ToggleActivityCheckReturn,
  ValidateDayReturn,
} from "@shared/db";
import { localDateString } from "@shared/utils/date";
import type { HomeRoutineVM } from "../types";
import {
  buildHomeRoutineVm,
  type ProfileMomentJoinRow,
  type RoutineDailyCheckRow,
  type RoutineProfileRow,
  type RoutineValidationRow,
} from "./routineMapper";

const db = supabase as any;

function requireRpcRow<T>(rows: T[] | null, opName: string): T {
  if (!rows || rows.length === 0) {
    throw new Error(`Réponse RPC invalide (${opName})`);
  }
  return rows[0]!;
}

async function readTaskCheckedState(params: {
  profileId: string;
  pivotTaskId: string;
  date: string;
}): Promise<boolean> {
  const { data, error } = await db
    .from("daily_checks")
    .select("checked")
    .eq("profile_id", params.profileId)
    .eq("check_date", params.date)
    .eq("target_type", "task")
    .eq("profile_moment_activity_task_id", params.pivotTaskId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return ((data as { checked: boolean } | null)?.checked) ?? false;
}

// ─── Lecture de la routine du jour ───────────────────────────────────────────
// Construit le HomeRoutineVM depuis Supabase avec une seule requête par niveau.
export async function getRoutineForDate(
  profileId: string,
  date = localDateString()
): Promise<HomeRoutineVM> {
  // 1. Profil
  const { data: profileRaw, error: profileErr } = await db
    .from("profiles")
    .select("id, name, primary_color, secondary_color, balance")
    .eq("id", profileId)
    .single();
  const profile = profileRaw as RoutineProfileRow | null;

  if (profileErr || !profile) throw new Error("Profil introuvable");

  // 2. Moments du profil avec leurs activités et tâches (jointures en cascade)
  const { data: pmRowsRaw, error: pmErr } = await db
    .from("profile_moments")
    .select(`
      id,
      stars,
      sort_index,
      moments ( id, name, kind, label, sort_index ),
      profile_moment_activities (
        id,
        stars,
        sticker_key,
        sort_index,
        activities ( id, name, label, icon, sort_index ),
        profile_moment_activity_tasks (
          id,
          stars,
          sort_index,
          tasks ( id, name, label, sort_index )
        )
      )
    `)
    .eq("profile_id", profileId)
    .order("sort_index", { ascending: true });

  if (pmErr) throw new Error(pmErr.message);
  const pmRows = (pmRowsRaw ?? []) as unknown as ProfileMomentJoinRow[];

  // 3. Checks du jour
  const { data: checksRaw, error: checksErr } = await db
    .from("daily_checks")
    .select("*")
    .eq("profile_id", profileId)
    .eq("check_date", date);
  const checks = (checksRaw ?? []) as RoutineDailyCheckRow[];

  if (checksErr) throw new Error(checksErr.message);

  const { data: validationRaw, error: validationsErr } = await db
    .from("daily_validations")
    .select("earned_stars")
    .eq("profile_id", profileId)
    .eq("check_date", date)
    .maybeSingle();
  const validation = validationRaw as RoutineValidationRow | null;

  if (validationsErr) throw new Error(validationsErr.message);

  return buildHomeRoutineVm({
    profile,
    profileMomentRows: pmRows,
    checks,
    validation,
  });
}

// ─── RPC métier Home ──────────────────────────────────────────────────────────
export async function toggleTask(params: {
  profileId: string;
  pivotTaskId: string;
  date?: string;
}): Promise<ToggleTaskCheckReturn> {
  const date = params.date ?? localDateString();

  const { data, error } = await db.rpc("toggle_task_check", {
    p_profile_id: params.profileId,
    p_profile_moment_activity_task_id: params.pivotTaskId,
    p_check_date: date,
  });

  if (error) throw new Error(error.message);
  return requireRpcRow(data as ToggleTaskCheckReturn[] | null, "toggle_task_check");
}

export async function toggleActivity(params: {
  profileId: string;
  pivotActivityId: string;
  date?: string;
}): Promise<ToggleActivityCheckReturn> {
  const date = params.date ?? localDateString();

  const { data, error } = await db.rpc("toggle_activity_check", {
    p_profile_id: params.profileId,
    p_profile_moment_activity_id: params.pivotActivityId,
    p_check_date: date,
  });

  if (error) throw new Error(error.message);
  return requireRpcRow(data as ToggleActivityCheckReturn[] | null, "toggle_activity_check");
}

export async function validateDay(
  profileId: string,
  date = localDateString()
): Promise<ValidateDayReturn> {
  const { data, error } = await db.rpc("validate_day", {
    p_profile_id: profileId,
    p_check_date: date,
  });

  if (error) throw new Error(error.message);
  return requireRpcRow(data as ValidateDayReturn[] | null, "validate_day");
}

// ─── Compat (à supprimer après migration hook/repo complète) ─────────────────
export async function checkTask(params: {
  profileId: string;
  pivotTaskId: string;         // profile_moment_activity_tasks.id
  pivotActivityId: string;     // déprécié (non utilisé)
  stickerKey: string;          // déprécié (non utilisé)
  date?: string;
}): Promise<void> {
  void params.pivotActivityId;
  void params.stickerKey;
  const date = params.date ?? localDateString();
  const alreadyChecked = await readTaskCheckedState({
    profileId: params.profileId,
    pivotTaskId: params.pivotTaskId,
    date,
  });

  if (!alreadyChecked) {
    await toggleTask({
      profileId: params.profileId,
      pivotTaskId: params.pivotTaskId,
      date,
    });
  }
}

export async function uncheckTask(params: {
  profileId: string;
  pivotTaskId: string;
  date?: string;
}): Promise<void> {
  const date = params.date ?? localDateString();
  const alreadyChecked = await readTaskCheckedState({
    profileId: params.profileId,
    pivotTaskId: params.pivotTaskId,
    date,
  });

  if (alreadyChecked) {
    await toggleTask({
      profileId: params.profileId,
      pivotTaskId: params.pivotTaskId,
      date,
    });
  }
}
