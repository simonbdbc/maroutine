-- Migration non destructive: chaque compte possède sa copie du catalogue seed
-- et l'app ne lit plus directement les lignes globales `user_id IS NULL`.

BEGIN;

CREATE TABLE IF NOT EXISTS public.user_catalog_states (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  seeded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.initialize_user_catalog(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claimed_user_id UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.user_catalog_states (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING
  RETURNING user_id INTO v_claimed_user_id;

  IF v_claimed_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.moments (user_id, name, kind, label, default_stars, sort_index)
  SELECT
    p_user_id,
    seed.name,
    seed.kind,
    COALESCE(seed.label, seed.name),
    seed.default_stars,
    seed.sort_index
  FROM public.moments seed
  WHERE seed.user_id IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.moments owned
      WHERE owned.user_id = p_user_id
        AND owned.name = seed.name
    );

  INSERT INTO public.activities (user_id, name, label, icon, default_stars, sort_index)
  SELECT
    p_user_id,
    seed.name,
    COALESCE(seed.label, seed.name),
    seed.icon,
    seed.default_stars,
    seed.sort_index
  FROM public.activities seed
  WHERE seed.user_id IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.activities owned
      WHERE owned.user_id = p_user_id
        AND owned.name = seed.name
    );

  INSERT INTO public.tasks (user_id, name, label, default_stars, sort_index)
  SELECT
    p_user_id,
    seed.name,
    COALESCE(seed.label, seed.name),
    seed.default_stars,
    seed.sort_index
  FROM public.tasks seed
  WHERE seed.user_id IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.tasks owned
      WHERE owned.user_id = p_user_id
        AND owned.name = seed.name
    );

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.initialize_my_catalog()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.initialize_user_catalog(auth.uid());
$$;

REVOKE ALL ON FUNCTION public.initialize_user_catalog(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.initialize_my_catalog() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.initialize_my_catalog() TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_auth_user_catalog_init()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.initialize_user_catalog(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auth_user_catalog_init ON auth.users;
CREATE TRIGGER trg_auth_user_catalog_init
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_catalog_init();

ALTER TABLE public.user_catalog_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_catalog_states_select_own" ON public.user_catalog_states;
CREATE POLICY "user_catalog_states_select_own" ON public.user_catalog_states FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "moments_select_own" ON public.moments;
CREATE POLICY "moments_select_own" ON public.moments FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "activities_select_own" ON public.activities;
CREATE POLICY "activities_select_own" ON public.activities FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "tasks_select_own" ON public.tasks;
CREATE POLICY "tasks_select_own" ON public.tasks FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

SELECT public.initialize_user_catalog(u.id)
FROM auth.users u
LEFT JOIN public.user_catalog_states state ON state.user_id = u.id
WHERE state.user_id IS NULL;

-- Repointage best-effort des routines existantes vers le catalogue du compte.
-- La correspondance repose sur le `sort_index` du seed, stable tant que les
-- éléments seed n'ont pas été supprimés. En cas d'ambiguïté, on laisse la
-- référence legacy en place; la policy SELECT ci-dessus la garde lisible.

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
