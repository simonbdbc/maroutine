import { supabase } from "@shared/db";
import { cloneRoutineDraftForProfile } from "./profileRoutineClone";
import { readProfileRoutineDraft } from "./builderReadService";
import { saveProfileRoutineDraft } from "./builderWriteService";

async function clearProfileRoutine(profileId: string): Promise<void> {
  const { error } = await supabase
    .from("profile_moments")
    .delete()
    .eq("profile_id", profileId);

  if (error) {
    throw new Error(`Remplacement routine: ${error.message}`);
  }
}

export async function copyProfileRoutine(
  sourceProfileId: string,
  targetProfileId: string
): Promise<void> {
  if (sourceProfileId === targetProfileId) {
    throw new Error("Choisis deux profils différents.");
  }

  const sourceDraft = await readProfileRoutineDraft(sourceProfileId);
  const targetDraft = cloneRoutineDraftForProfile(sourceDraft, targetProfileId);

  await clearProfileRoutine(targetProfileId);
  await saveProfileRoutineDraft(targetDraft);
}
