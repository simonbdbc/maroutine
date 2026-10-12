import { supabase } from "@shared/db";
import type {
  BalanceHistoryRow,
  InsertTables,
  RedeemProfileRewardReturn,
  SetProfileBalanceReturn,
} from "@shared/db";
import { listProfiles } from "@features/profiles/services/profileRepo";
import type {
  BalanceHistoryEntry,
  CatalogReward,
  ProfileReward,
  RedeemProfileRewardResult,
} from "../types";
import { assertProfileRewardInput } from "./rewardValidation";

const db = supabase as any;

type ProfileRewardJoinRow = {
  id: string;
  profile_id: string;
  reward_id: string;
  duration_minutes: number;
  cost_stars: number;
  sort_index: number;
  rewards?: { id: string; name: string } | { id: string; name: string }[] | null;
};

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) throw new Error("Non authentifié");
  return uid;
}

function requireRpcRow<T>(rows: T[] | null, opName: string): T {
  if (!rows || rows.length === 0) {
    throw new Error(`Réponse RPC invalide (${opName})`);
  }
  return rows[0]!;
}

function nextSortIndex(items: Array<{ sortIndex: number }>): number {
  return items.reduce((max, item) => Math.max(max, item.sortIndex), -1) + 1;
}

function rewardNameFromJoin(row: ProfileRewardJoinRow): string {
  const reward = Array.isArray(row.rewards) ? row.rewards[0] : row.rewards;
  return reward?.name ?? "Récompense";
}

export async function listRewards(): Promise<CatalogReward[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("rewards")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id ?? userId,
    name: row.name,
    sortIndex: row.sort_index,
  }));
}

export async function createReward(input: { name: string }): Promise<CatalogReward> {
  const userId = await getUserId();
  const existing = await listRewards();
  const name = input.name.trim();
  if (name.length === 0) throw new Error("Le nom de la récompense est obligatoire.");

  const { data, error } = await supabase
    .from("rewards")
    .insert({
      user_id: userId,
      name,
      sort_index: nextSortIndex(existing),
    } as InsertTables<"rewards">)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return {
    id: data.id,
    userId: data.user_id ?? userId,
    name: data.name,
    sortIndex: data.sort_index,
  };
}

export async function updateReward(id: string, patch: { name: string }): Promise<void> {
  const name = patch.name.trim();
  if (name.length === 0) throw new Error("Le nom de la récompense est obligatoire.");

  const { error } = await supabase
    .from("rewards")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteReward(id: string): Promise<void> {
  const { error: profileRewardsError } = await supabase
    .from("profile_rewards")
    .delete()
    .eq("reward_id", id);

  if (profileRewardsError) throw new Error(profileRewardsError.message);

  const { error } = await supabase.from("rewards").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listProfileRewards(profileId: string): Promise<ProfileReward[]> {
  const { data, error } = await db
    .from("profile_rewards")
    .select(`
      id,
      profile_id,
      reward_id,
      duration_minutes,
      cost_stars,
      sort_index,
      rewards ( id, name )
    `)
    .eq("profile_id", profileId)
    .order("sort_index", { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as ProfileRewardJoinRow[]).map((row) => ({
    id: row.id,
    profileId: row.profile_id,
    rewardId: row.reward_id,
    rewardName: rewardNameFromJoin(row),
    durationMinutes: row.duration_minutes,
    costStars: row.cost_stars,
    sortIndex: row.sort_index,
  }));
}

export async function createProfileReward(input: {
  profileId: string;
  rewardId: string;
  durationMinutes: number;
  costStars: number;
}): Promise<void> {
  assertProfileRewardInput(input);
  const existing = await listProfileRewards(input.profileId);

  const { error } = await supabase.from("profile_rewards").insert({
    profile_id: input.profileId,
    reward_id: input.rewardId,
    duration_minutes: input.durationMinutes,
    cost_stars: input.costStars,
    sort_index: nextSortIndex(existing),
  } as InsertTables<"profile_rewards">);

  if (error) throw new Error(error.message);
}

export async function updateProfileReward(
  id: string,
  patch: { rewardId: string; durationMinutes: number; costStars: number }
): Promise<void> {
  assertProfileRewardInput(patch);
  const { error } = await supabase
    .from("profile_rewards")
    .update({
      reward_id: patch.rewardId,
      duration_minutes: patch.durationMinutes,
      cost_stars: patch.costStars,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteProfileReward(id: string): Promise<void> {
  const { error } = await supabase.from("profile_rewards").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function redeemProfileReward(profileRewardId: string): Promise<RedeemProfileRewardResult> {
  const { data, error } = await db.rpc("redeem_profile_reward", {
    p_profile_reward_id: profileRewardId,
  });

  if (error) throw new Error(error.message);
  const result = requireRpcRow(data as RedeemProfileRewardReturn[] | null, "redeem_profile_reward");
  return {
    profileId: result.profile_id,
    spentStars: result.spent_stars,
    newBalance: result.new_balance,
  };
}

export async function setProfileBalanceWithHistory(params: {
  profileId: string;
  amount: number;
  description: string;
}): Promise<SetProfileBalanceReturn> {
  const { data, error } = await db.rpc("set_profile_balance", {
    p_profile_id: params.profileId,
    p_amount: params.amount,
    p_description: params.description,
  });

  if (error) throw new Error(error.message);
  return requireRpcRow(data as SetProfileBalanceReturn[] | null, "set_profile_balance");
}

export async function listBalanceHistory(params: {
  start: Date;
  end: Date;
}): Promise<BalanceHistoryEntry[]> {
  const profiles = await listProfiles();
  const profileNameById = new Map(profiles.map((profile) => [profile.id, profile.name]));

  const { data, error } = await supabase
    .from("balance_history")
    .select("*")
    .gte("occurred_at", params.start.toISOString())
    .lt("occurred_at", params.end.toISOString())
    .order("occurred_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as BalanceHistoryRow[]).map((row) => ({
    id: row.id,
    profileId: row.profile_id,
    profileName: profileNameById.get(row.profile_id) ?? "Enfant",
    deltaStars: row.delta_stars,
    balanceBefore: row.balance_before,
    balanceAfter: row.balance_after,
    source: row.source,
    description: row.description,
    occurredAt: row.occurred_at,
  }));
}
