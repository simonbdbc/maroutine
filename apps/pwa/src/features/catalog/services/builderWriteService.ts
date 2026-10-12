import { supabase } from "@shared/db";
import type { ProfileRoutineDraft } from "../types";
import { isDraftLink } from "../types";
import { DEFAULT_STICKER_KEY } from "../../stickers/registry";

function resolveStickerKey(stickerKey: string): string {
  const normalized = stickerKey.trim();
  return normalized.length > 0 ? normalized : DEFAULT_STICKER_KEY;
}

/**
 * Sauvegarde le draft de la routine d'un profil en DB.
 *
 * Stratégie : diff entre ce qui existe en DB et le draft.
 * - Nouveaux éléments (linkId commence par "draft:") → INSERT
 * - Éléments existants → UPDATE (stars, sort_index)
 * - Éléments supprimés (en DB mais plus dans le draft) → DELETE
 *
 * Exécuté séquentiellement (pas de vraie transaction Supabase côté client,
 * mais la logique est idempotente et les deletes sont en cascade côté DB).
 */
export async function saveProfileRoutineDraft(
  draft: ProfileRoutineDraft
): Promise<void> {
  const { profileId, moments } = draft;

  // ── 1. Charger les pivots existants en DB ──────────────────────────────────
  const { data: existingPm } = await supabase
    .from("profile_moments")
    .select("id").eq("profile_id", profileId);
  const existingPmIds = new Set((existingPm ?? []).map((r) => r.id));

  const keptPmIds = new Set<string>();
  const keptPmaIds = new Set<string>();
  const keptPmatIds = new Set<string>();

  // ── 2. Upsert moments ─────────────────────────────────────────────────────
  for (const [mIdx, m] of moments.entries()) {
    let pmId: string;

    if (isDraftLink(m.linkId)) {
      // INSERT new moment pivot
      const { data, error } = await supabase
        .from("profile_moments")
        .insert({
          profile_id: profileId,
          moment_id: m.momentId,
          stars: m.stars,
          sort_index: mIdx,
        })
        .select("id")
        .single();
      if (error) throw new Error(`Insert moment: ${error.message}`);
      pmId = data.id;
    } else {
      // UPDATE existing
      pmId = m.linkId;
      await supabase
        .from("profile_moments")
        .update({ moment_id: m.momentId, stars: m.stars, sort_index: mIdx })
        .eq("id", pmId);
    }
    keptPmIds.add(pmId);

    // ── 3. Upsert activities within this moment ───────────────────────────
    // Load existing activities for this moment
    const { data: existingPma } = await supabase
      .from("profile_moment_activities")
      .select("id").eq("profile_moment_id", pmId);
    const existingPmaIds = new Set((existingPma ?? []).map((r) => r.id));

    for (const [aIdx, a] of m.activities.entries()) {
      let pmaId: string;
      const activityStickerKey = resolveStickerKey(a.stickerKey);

      if (isDraftLink(a.linkId)) {
        const { data, error } = await supabase
          .from("profile_moment_activities")
          .insert({
            profile_moment_id: pmId,
            activity_id: a.activityId,
            stars: a.stars,
            sticker_key: activityStickerKey,
            sort_index: aIdx,
          })
          .select("id")
          .single();
        if (error) throw new Error(`Insert activity: ${error.message}`);
        pmaId = data.id;
      } else {
        pmaId = a.linkId;
        await supabase
          .from("profile_moment_activities")
          .update({
            activity_id: a.activityId,
            stars: a.stars,
            sticker_key: activityStickerKey,
            sort_index: aIdx,
          })
          .eq("id", pmaId);
      }
      keptPmaIds.add(pmaId);

      // ── 4. Upsert tasks within this activity ─────────────────────────
      const { data: existingPmat } = await supabase
        .from("profile_moment_activity_tasks")
        .select("id").eq("profile_moment_activity_id", pmaId);
      const existingPmatIds = new Set((existingPmat ?? []).map((r) => r.id));

      for (const [tIdx, t] of a.tasks.entries()) {
        let pmatId: string;

        if (isDraftLink(t.linkId)) {
          const { data, error } = await supabase
            .from("profile_moment_activity_tasks")
            .insert({
              profile_moment_activity_id: pmaId,
              task_id: t.taskId,
              stars: t.stars,
              sort_index: tIdx,
            })
            .select("id")
            .single();
          if (error) throw new Error(`Insert task: ${error.message}`);
          pmatId = data.id;
        } else {
          pmatId = t.linkId;
          await supabase
            .from("profile_moment_activity_tasks")
            .update({ task_id: t.taskId, stars: t.stars, sort_index: tIdx })
            .eq("id", pmatId);
        }
        keptPmatIds.add(pmatId);
      }

      // Delete removed tasks
      for (const id of existingPmatIds) {
        if (!keptPmatIds.has(id)) {
          await supabase.from("profile_moment_activity_tasks").delete().eq("id", id);
        }
      }
    }

    // Delete removed activities
    for (const id of existingPmaIds) {
      if (!keptPmaIds.has(id)) {
        await supabase.from("profile_moment_activities").delete().eq("id", id);
      }
    }
  }

  // ── 5. Delete removed moments ──────────────────────────────────────────────
  for (const id of existingPmIds) {
    if (!keptPmIds.has(id)) {
      await supabase.from("profile_moments").delete().eq("id", id);
    }
  }
}
