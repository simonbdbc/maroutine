import { supabase } from "@shared/db";
import type { DayMoment, Activity, Task } from "../types";
import { ensureAccountCatalogInitialized } from "../../catalog/services/catalogBootstrap";

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) throw new Error("Non authentifié");
  return userId;
}

// ─── Moments du compte ───────────────────────────────────────────────────────
export async function listMoments(): Promise<DayMoment[]> {
  await ensureAccountCatalogInitialized();
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("moments")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    kind: r.kind,
    label: r.label,
    defaultStars: r.default_stars,
    sortIndex: r.sort_index,
  }));
}

// ─── Activités du compte ─────────────────────────────────────────────────────
export async function listActivities(): Promise<Activity[]> {
  await ensureAccountCatalogInitialized();
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    label: r.label,
    icon: r.icon,
    defaultStars: r.default_stars,
    sortIndex: r.sort_index,
  }));
}

// ─── Tâches du compte ────────────────────────────────────────────────────────
export async function listTasks(): Promise<Task[]> {
  await ensureAccountCatalogInitialized();
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    label: r.label,
    defaultStars: r.default_stars,
    sortIndex: r.sort_index,
  }));
}
