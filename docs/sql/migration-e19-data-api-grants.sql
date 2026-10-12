-- MaRoutine : droits explicites pour une Data API Supabase neuve.
-- Les GRANT autorisent l'opération ; les policies RLS existantes filtrent
-- toujours les lignes au compte propriétaire. Aucun droit accordé à anon,
-- aucune modification des privilèges par défaut ni des tables futures.
-- Sur une base existante : sauvegarde, revue des ACL/RLS et autorisation
-- de migration requises ; ce fichier ne révoque pas les anciens droits.
BEGIN;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.profiles,
  public.moments,
  public.activities,
  public.tasks,
  public.rewards,
  public.profile_moments,
  public.profile_rewards,
  public.profile_moment_activities,
  public.profile_moment_activity_tasks,
  public.daily_checks
TO authenticated;

-- Lecture de la validation puis réouverture du jour dans settingsRepo.
-- Les insertions/mises à jour restent effectuées par validate_day.
GRANT SELECT, DELETE ON TABLE public.daily_validations TO authenticated;
-- Les écritures d'historique restent réservées aux RPC SECURITY DEFINER.
GRANT SELECT ON TABLE public.balance_history TO authenticated;

COMMIT;
