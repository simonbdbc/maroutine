import { supabase } from "@shared/db";
import type { InsertTables } from "@shared/db";

const initializationByUserId = new Map<string, Promise<void>>();
const CATALOG_BOOTSTRAP_RPC_ERROR_CODES = new Set([
  "PGRST202",
  "42883",
  "42P01",
]);

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) throw new Error("Non authentifié");
  return userId;
}

function canFallbackToLegacyBootstrap(error: Error & { code?: string }): boolean {
  if (error.code && CATALOG_BOOTSTRAP_RPC_ERROR_CODES.has(error.code)) {
    return true;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("initialize_my_catalog")
    || message.includes("function")
    || message.includes("user_catalog_states")
  );
}

async function legacyBootstrapAccountCatalog(userId: string): Promise<void> {
  const { data: existingMoments, error: existingMomentsError } = await supabase
    .from("moments")
    .select("id")
    .eq("user_id", userId)
    .limit(1);
  if (existingMomentsError) throw new Error(existingMomentsError.message);
  const hasExistingMoments = (existingMoments ?? []).length > 0;

  const [
    { data: seedMoments, error: momentsError },
    { data: seedActivities, error: activitiesError },
    { data: seedTasks, error: tasksError },
    { data: seedRewards, error: rewardsError },
  ] = await Promise.all([
    supabase.from("moments").select("*").is("user_id", null).order("sort_index", { ascending: true }),
    supabase.from("activities").select("*").is("user_id", null).order("sort_index", { ascending: true }),
    supabase.from("tasks").select("*").is("user_id", null).order("sort_index", { ascending: true }),
    supabase.from("rewards").select("*").is("user_id", null).order("sort_index", { ascending: true }),
  ]);

  if (momentsError) throw new Error(momentsError.message);
  if (activitiesError) throw new Error(activitiesError.message);
  if (tasksError) throw new Error(tasksError.message);
  if (rewardsError && rewardsError.code !== "42P01") {
    throw new Error(rewardsError.message);
  }

  if (!hasExistingMoments && (seedMoments ?? []).length > 0) {
    const rows: InsertTables<"moments">[] = seedMoments.map((row) => ({
      user_id: userId,
      name: row.name,
      kind: row.kind,
      label: row.label,
      default_stars: row.default_stars,
      sort_index: row.sort_index,
    }));
    const { error } = await supabase.from("moments").insert(rows);
    if (error) throw new Error(error.message);
  }

  if (!hasExistingMoments && (seedActivities ?? []).length > 0) {
    const rows: InsertTables<"activities">[] = seedActivities.map((row) => ({
      user_id: userId,
      name: row.name,
      label: row.label,
      icon: row.icon,
      default_stars: row.default_stars,
      sort_index: row.sort_index,
    }));
    const { error } = await supabase.from("activities").insert(rows);
    if (error) throw new Error(error.message);
  }

  if (!hasExistingMoments && (seedTasks ?? []).length > 0) {
    const rows: InsertTables<"tasks">[] = seedTasks.map((row) => ({
      user_id: userId,
      name: row.name,
      label: row.label,
      default_stars: row.default_stars,
      sort_index: row.sort_index,
    }));
    const { error } = await supabase.from("tasks").insert(rows);
    if (error) throw new Error(error.message);
  }

  if (!rewardsError && (seedRewards ?? []).length > 0) {
    const { data: existingRewards, error: existingRewardsError } = await supabase
      .from("rewards")
      .select("id")
      .eq("user_id", userId)
      .limit(1);
    if (existingRewardsError) throw new Error(existingRewardsError.message);

    if ((existingRewards ?? []).length === 0) {
      const rows: InsertTables<"rewards">[] = seedRewards.map((row) => ({
        user_id: userId,
        name: row.name,
        sort_index: row.sort_index,
      }));
      const { error } = await supabase.from("rewards").insert(rows);
      if (error) throw new Error(error.message);
    }
  }
}

/**
 * Garantit que le catalogue propre au compte existe.
 *
 * Le bootstrap réel est géré côté DB via `initialize_my_catalog()`, qui ne
 * seed qu'une seule fois par compte grâce à un état dédié.
 */
export async function ensureAccountCatalogInitialized(): Promise<void> {
  const userId = await getUserId();
  let pending = initializationByUserId.get(userId);

  if (!pending) {
    pending = (async () => {
      const { error } = await supabase.rpc("initialize_my_catalog");
      if (error) {
        const normalizedError = Object.assign(new Error(error.message), { code: error.code });
        if (!canFallbackToLegacyBootstrap(normalizedError)) {
          throw normalizedError;
        }
        await legacyBootstrapAccountCatalog(userId);
      }
    })();
    initializationByUserId.set(userId, pending);
  }

  try {
    await pending;
  } catch (error) {
    initializationByUserId.delete(userId);
    throw error;
  }
}
