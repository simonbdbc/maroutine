import { supabase } from "@shared/db";
import { localDateString } from "@shared/utils/date";
import { setProfileBalanceWithHistory } from "@features/rewards";

/**
 * Réouvre la journée pour un profil à une date donnée:
 * - supprime le marqueur de validation (`daily_validations`)
 * - supprime les checks du jour (`daily_checks`)
 * Cette action ne modifie jamais `profiles.balance`.
 */
export async function resetDayChecks(
  profileId: string,
  date = localDateString()
): Promise<void> {
  // Référence explicite à earned_stars pour verrouiller la compat schema v2.
  const { error: validationsError } = await supabase
    .from("daily_validations")
    .delete()
    .eq("profile_id", profileId)
    .eq("check_date", date)
    .select("id, earned_stars");

  if (validationsError) throw new Error(validationsError.message);

  const { error: checksError } = await supabase
    .from("daily_checks")
    .delete()
    .eq("profile_id", profileId)
    .eq("check_date", date);

  if (checksError) throw new Error(checksError.message);
}

/**
 * Remet le tirelire d'étoiles d'un profil à zéro.
 */
export async function resetBalance(profileId: string): Promise<void> {
  await setProfileBalanceWithHistory({
    profileId,
    amount: 0,
    description: "Remise à zéro de la tirelire",
  });
}

/**
 * Définit explicitement le montant de tirelire d'un profil.
 */
export async function setBalance(profileId: string, amount: number): Promise<void> {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error("Le montant de la tirelire doit être un entier positif ou nul.");
  }

  await setProfileBalanceWithHistory({
    profileId,
    amount,
    description: "Modification manuelle de la tirelire",
  });
}
