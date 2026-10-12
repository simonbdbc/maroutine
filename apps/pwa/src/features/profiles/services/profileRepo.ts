import { supabase } from "@shared/db";
import type { CreateProfileFromTemplateReturn, InsertTables } from "@shared/db";
import { ensureAccountCatalogInitialized } from "../../catalog/services/catalogBootstrap";
import {
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
  normalizePrimaryColor,
  normalizeSecondaryColor,
  rowToChildProfile,
  type ChildProfile,
} from "../types";

// ─── Inputs ───────────────────────────────────────────────────────────────────
export type CreateProfileInput = {
  name: string;
  primaryColor?: string;
  secondaryColor?: string;
  stickerKey?: string;
};

export type UpdateProfileInput = {
  name?: string;
  primaryColor?: string;
  secondaryColor?: string;
  stickerKey?: string;
  balance?: number;
  sortIndex?: number;
};

// ─── Helper ───────────────────────────────────────────────────────────────────
async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) throw new Error("Non authentifié");
  return userId;
}

// ─── Lecture ──────────────────────────────────────────────────────────────────
export async function listProfiles(): Promise<ChildProfile[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .order("sort_index", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToChildProfile);
}

export async function getProfile(id: string): Promise<ChildProfile | null> {
  const { data, error } = await supabase
    .from("profiles").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }
  return rowToChildProfile(data);
}

// ─── Création ─────────────────────────────────────────────────────────────────
export async function createProfile(input: CreateProfileInput): Promise<ChildProfile> {
  const userId = await getUserId();
  await ensureAccountCatalogInitialized();
  const existing = await listProfiles();

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      user_id: userId,
      name: input.name.trim(),
      primary_color: normalizePrimaryColor(input.primaryColor ?? DEFAULT_PRIMARY_COLOR),
      secondary_color: normalizeSecondaryColor(input.secondaryColor ?? DEFAULT_SECONDARY_COLOR),
      sticker_key: input.stickerKey ?? "penguin",
      balance: 0,
      sort_index: existing.length,
    } as InsertTables<"profiles">)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Seed les 4 pivots profile_moments par défaut
  await seedProfileMoments(data.id, userId);

  return rowToChildProfile(data);
}

export async function createExampleProfile(): Promise<ChildProfile> {
  const { data, error } = await (supabase as any).rpc("create_profile_from_template", {
    p_template_key: "example",
  });

  if (error) throw new Error(error.message);

  const rows = data as CreateProfileFromTemplateReturn[] | null;
  const row = rows?.[0];
  if (!row) {
    throw new Error("Réponse RPC invalide (create_profile_from_template)");
  }

  return rowToChildProfile(row);
}

// ─── Mise à jour ──────────────────────────────────────────────────────────────
export async function updateProfile(
  id: string,
  patch: UpdateProfileInput
): Promise<ChildProfile> {
  const dbPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) dbPatch.name = patch.name.trim();
  if (patch.primaryColor !== undefined) {
    dbPatch.primary_color = normalizePrimaryColor(patch.primaryColor);
  }
  if (patch.secondaryColor !== undefined) {
    dbPatch.secondary_color = normalizeSecondaryColor(patch.secondaryColor);
  }
  if (patch.stickerKey !== undefined) dbPatch.sticker_key = patch.stickerKey;
  if (patch.balance !== undefined) dbPatch.balance = patch.balance;
  if (patch.sortIndex !== undefined) dbPatch.sort_index = patch.sortIndex;

  const { data, error } = await supabase
    .from("profiles").update(dbPatch).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return rowToChildProfile(data);
}

// ─── Suppression ──────────────────────────────────────────────────────────────
export async function deleteProfile(id: string): Promise<void> {
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Réordonnement ────────────────────────────────────────────────────────────
export async function reorderProfiles(orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("profiles").update({ sort_index: index }).eq("id", id)
    )
  );
}

// ─── Tirelire ────────────────────────────────────────────────────────────────────
export async function addToBalance(id: string, stars: number): Promise<void> {
  const profile = await getProfile(id);
  if (!profile) throw new Error("Profil introuvable");
  const nextBalance = Math.max(0, profile.balance + stars);
  const { error } = await (supabase as any).rpc("set_profile_balance", {
    p_profile_id: id,
    p_amount: nextBalance,
    p_description: stars >= 0 ? "Ajout manuel à la tirelire" : "Retrait manuel de la tirelire",
  });

  if (error) throw new Error(error.message);
}

// ─── Seed profile_moments ──────────────────────────────────────────────────────
async function seedProfileMoments(profileId: string, userId: string): Promise<void> {
  const { data: moments } = await supabase
    .from("moments")
    .select("id, sort_index")
    .eq("user_id", userId)
    .order("sort_index", { ascending: true });
  if (!moments?.length) return;

  await supabase.from("profile_moments").insert(
    moments.map((m, i) => ({
      profile_id: profileId,
      moment_id: m.id,
      stars: 0,
      sort_index: i,
    }))
  );
}
