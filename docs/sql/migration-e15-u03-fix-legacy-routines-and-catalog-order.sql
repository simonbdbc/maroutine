-- Correctif post E15-U02:
-- - réautoriser la lecture des lignes seed globales pour compat legacy;
-- - repointer les routines existantes vers les IDs du catalogue du compte
--   quand la correspondance seed -> copie user est retrouvable.

BEGIN;

DROP POLICY IF EXISTS "moments_select_own" ON public.moments;
CREATE POLICY "moments_select_own" ON public.moments FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "activities_select_own" ON public.activities;
CREATE POLICY "activities_select_own" ON public.activities FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "tasks_select_own" ON public.tasks;
CREATE POLICY "tasks_select_own" ON public.tasks FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

UPDATE public.profile_moments pm
SET moment_id = owned.id
FROM public.profiles p,
     public.moments legacy,
     public.moments owned
WHERE pm.profile_id = p.id
  AND legacy.id = pm.moment_id
  AND legacy.user_id IS NULL
  AND owned.user_id = p.user_id
  AND owned.sort_index = legacy.sort_index
  AND owned.kind = legacy.kind
  AND pm.moment_id <> owned.id
  AND NOT EXISTS (
    SELECT 1
    FROM public.profile_moments duplicate_pm
    WHERE duplicate_pm.profile_id = pm.profile_id
      AND duplicate_pm.moment_id = owned.id
      AND duplicate_pm.id <> pm.id
  );

UPDATE public.profile_moment_activities pma
SET activity_id = owned.id
FROM public.profile_moments pm,
     public.profiles p,
     public.activities legacy,
     public.activities owned
WHERE pma.profile_moment_id = pm.id
  AND p.id = pm.profile_id
  AND legacy.id = pma.activity_id
  AND legacy.user_id IS NULL
  AND owned.user_id = p.user_id
  AND owned.sort_index = legacy.sort_index
  AND pma.activity_id <> owned.id
  AND NOT EXISTS (
    SELECT 1
    FROM public.profile_moment_activities duplicate_pma
    WHERE duplicate_pma.profile_moment_id = pma.profile_moment_id
      AND duplicate_pma.activity_id = owned.id
      AND duplicate_pma.id <> pma.id
  );

UPDATE public.profile_moment_activity_tasks pmat
SET task_id = owned.id
FROM public.profile_moment_activities pma,
     public.profile_moments pm,
     public.profiles p,
     public.tasks legacy,
     public.tasks owned
WHERE pmat.profile_moment_activity_id = pma.id
  AND pm.id = pma.profile_moment_id
  AND p.id = pm.profile_id
  AND legacy.id = pmat.task_id
  AND legacy.user_id IS NULL
  AND owned.user_id = p.user_id
  AND owned.sort_index = legacy.sort_index
  AND pmat.task_id <> owned.id
  AND NOT EXISTS (
    SELECT 1
    FROM public.profile_moment_activity_tasks duplicate_pmat
    WHERE duplicate_pmat.profile_moment_activity_id = pmat.profile_moment_activity_id
      AND duplicate_pmat.task_id = owned.id
      AND duplicate_pmat.id <> pmat.id
  );

COMMIT;
