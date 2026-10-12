import { supabase } from "@shared/db";
import type { CatalogMoment, CatalogActivity, CatalogTask } from "../types";
import type { MomentKind } from "@shared/db";
import { ensureAccountCatalogInitialized } from "./catalogBootstrap";

type CatalogMomentRecord = {
  id: string;
  user_id: string | null;
  sort_index: number;
  kind: MomentKind;
};

type CatalogActivityRecord = {
  id: string;
  user_id: string | null;
  sort_index: number;
};

type CatalogTaskRecord = {
  id: string;
  user_id: string | null;
  sort_index: number;
};

// ─── Helper ───────────────────────────────────────────────────────────────────
async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) throw new Error("Non authentifié");
  return uid;
}

function nextSortIndex(items: Array<{ sortIndex: number }>): number {
  return items.reduce((max, item) => Math.max(max, item.sortIndex), -1) + 1;
}

function uniqueIds(ids: Array<string | null | undefined>): string[] {
  return Array.from(new Set(ids.filter((id): id is string => typeof id === "string" && id.length > 0)));
}

async function readMomentRecord(id: string): Promise<CatalogMomentRecord> {
  const { data, error } = await supabase
    .from("moments")
    .select("id, user_id, sort_index, kind")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data as CatalogMomentRecord;
}

async function readActivityRecord(id: string): Promise<CatalogActivityRecord> {
  const { data, error } = await supabase
    .from("activities")
    .select("id, user_id, sort_index")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data as CatalogActivityRecord;
}

async function readTaskRecord(id: string): Promise<CatalogTaskRecord> {
  const { data, error } = await supabase
    .from("tasks")
    .select("id, user_id, sort_index")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data as CatalogTaskRecord;
}

async function findLegacyMomentTwin(record: CatalogMomentRecord): Promise<string | null> {
  if (record.user_id == null) return null;
  const { data, error } = await supabase
    .from("moments")
    .select("id")
    .is("user_id", null)
    .eq("sort_index", record.sort_index)
    .eq("kind", record.kind)
    .limit(1);
  if (error) throw new Error(error.message);
  return data?.[0]?.id ?? null;
}

async function findLegacyActivityTwin(record: CatalogActivityRecord): Promise<string | null> {
  if (record.user_id == null) return null;
  const { data, error } = await supabase
    .from("activities")
    .select("id")
    .is("user_id", null)
    .eq("sort_index", record.sort_index)
    .limit(1);
  if (error) throw new Error(error.message);
  return data?.[0]?.id ?? null;
}

async function findLegacyTaskTwin(record: CatalogTaskRecord): Promise<string | null> {
  if (record.user_id == null) return null;
  const { data, error } = await supabase
    .from("tasks")
    .select("id")
    .is("user_id", null)
    .eq("sort_index", record.sort_index)
    .limit(1);
  if (error) throw new Error(error.message);
  return data?.[0]?.id ?? null;
}

// ─── Moments ──────────────────────────────────────────────────────────────────

export async function listMoments(): Promise<CatalogMoment[]> {
  await ensureAccountCatalogInitialized();
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("moments").select("*").eq("user_id", userId).order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id, userId: r.user_id, name: r.name, kind: r.kind as MomentKind,
    label: r.label, defaultStars: r.default_stars, sortIndex: r.sort_index,
  }));
}

export async function createMoment(input: {
  name: string; label?: string; kind: MomentKind;
}): Promise<CatalogMoment> {
  const userId = await getUserId();
  const existing = await listMoments();
  const { data, error } = await supabase.from("moments").insert({
    user_id: userId,
    name: input.name.trim(),
    kind: input.kind,
    label: input.label?.trim() ?? input.name.trim(),
    default_stars: 0,
    sort_index: nextSortIndex(existing),
  }).select().single();
  if (error) throw new Error(error.message);
  return { id: data.id, userId: data.user_id, name: data.name, kind: data.kind as MomentKind,
    label: data.label, defaultStars: data.default_stars, sortIndex: data.sort_index };
}

export async function updateMoment(id: string, patch: {
  name?: string; label?: string; kind?: MomentKind;
}): Promise<void> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) dbPatch.name = patch.name.trim();
  if (patch.label !== undefined) dbPatch.label = patch.label.trim();
  else if (patch.name !== undefined) dbPatch.label = patch.name.trim();
  if (patch.kind !== undefined) dbPatch.kind = patch.kind;
  const { error } = await supabase.from("moments").update(dbPatch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteMoment(id: string): Promise<void> {
  const record = await readMomentRecord(id);
  const linkedMomentIds = uniqueIds([record.id, await findLegacyMomentTwin(record)]);

  const { error: routineError } = await supabase
    .from("profile_moments")
    .delete()
    .in("moment_id", linkedMomentIds);
  if (routineError) throw new Error(routineError.message);

  const { error } = await supabase.from("moments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Activities ───────────────────────────────────────────────────────────────

export async function listActivities(): Promise<CatalogActivity[]> {
  await ensureAccountCatalogInitialized();
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("activities").select("*").eq("user_id", userId).order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id, userId: r.user_id, name: r.name, label: r.label, icon: r.icon,
    defaultStars: r.default_stars, sortIndex: r.sort_index,
  }));
}

export async function createActivity(input: {
  name: string; label?: string; icon?: string;
}): Promise<CatalogActivity> {
  const userId = await getUserId();
  const existing = await listActivities();
  const { data, error } = await supabase.from("activities").insert({
    user_id: userId,
    name: input.name.trim(),
    label: input.label?.trim() ?? input.name.trim(),
    icon: input.icon ?? null,
    default_stars: 0,
    sort_index: nextSortIndex(existing),
  }).select().single();
  if (error) throw new Error(error.message);
  return { id: data.id, userId: data.user_id, name: data.name, label: data.label, icon: data.icon,
    defaultStars: data.default_stars, sortIndex: data.sort_index };
}

export async function updateActivity(id: string, patch: {
  name?: string; label?: string; icon?: string;
}): Promise<void> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) dbPatch.name = patch.name.trim();
  if (patch.label !== undefined) dbPatch.label = patch.label.trim();
  else if (patch.name !== undefined) dbPatch.label = patch.name.trim();
  if (patch.icon !== undefined) dbPatch.icon = patch.icon;
  const { error } = await supabase.from("activities").update(dbPatch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteActivity(id: string): Promise<void> {
  const record = await readActivityRecord(id);
  const linkedActivityIds = uniqueIds([record.id, await findLegacyActivityTwin(record)]);

  const { error: routineError } = await supabase
    .from("profile_moment_activities")
    .delete()
    .in("activity_id", linkedActivityIds);
  if (routineError) throw new Error(routineError.message);

  const { error } = await supabase.from("activities").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function listTasks(): Promise<CatalogTask[]> {
  await ensureAccountCatalogInitialized();
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("tasks").select("*").eq("user_id", userId).order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id, userId: r.user_id, name: r.name, label: r.label,
    defaultStars: r.default_stars, sortIndex: r.sort_index,
  }));
}

export async function createTask(input: {
  name: string; label?: string;
}): Promise<CatalogTask> {
  const userId = await getUserId();
  const existing = await listTasks();
  const { data, error } = await supabase.from("tasks").insert({
    user_id: userId,
    name: input.name.trim(),
    label: input.label?.trim() ?? input.name.trim(),
    default_stars: 0,
    sort_index: nextSortIndex(existing),
  }).select().single();
  if (error) throw new Error(error.message);
  return { id: data.id, userId: data.user_id, name: data.name, label: data.label,
    defaultStars: data.default_stars, sortIndex: data.sort_index };
}

export async function updateTask(id: string, patch: {
  name?: string; label?: string;
}): Promise<void> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) dbPatch.name = patch.name.trim();
  if (patch.label !== undefined) dbPatch.label = patch.label.trim();
  else if (patch.name !== undefined) dbPatch.label = patch.name.trim();
  const { error } = await supabase.from("tasks").update(dbPatch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteTask(id: string): Promise<void> {
  const record = await readTaskRecord(id);
  const linkedTaskIds = uniqueIds([record.id, await findLegacyTaskTwin(record)]);

  const { error: routineError } = await supabase
    .from("profile_moment_activity_tasks")
    .delete()
    .in("task_id", linkedTaskIds);
  if (routineError) throw new Error(routineError.message);

  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
