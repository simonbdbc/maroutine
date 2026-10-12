-- ─────────────────────────────────────────────────────────────────────────────
-- E18 — Fix RPC profil exemple: reference `id` ambigue
-- A executer apres E17 si `create_profile_from_template()` echoue avec:
-- "column reference \"id\" is ambiguous".
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_profile_from_template(
  p_template_key TEXT DEFAULT 'example'
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  sticker_key TEXT,
  balance INTEGER,
  sort_index INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_template public.profile_templates%ROWTYPE;
  v_profile_id UUID;
  v_name_base TEXT;
  v_name_candidate TEXT;
  v_suffix INTEGER := 1;
  v_sort_index INTEGER := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non authentifie'
      USING ERRCODE = 'P0001';
  END IF;

  PERFORM public.initialize_user_catalog(v_user_id);

  SELECT *
  INTO v_template
  FROM public.profile_templates
  WHERE template_key = COALESCE(NULLIF(btrim(p_template_key), ''), 'example');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template de profil introuvable'
      USING ERRCODE = 'P0001';
  END IF;

  v_name_base := COALESCE(NULLIF(btrim(v_template.name), ''), 'Exemple');
  v_name_candidate := v_name_base;

  WHILE EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = v_user_id
      AND p.name = v_name_candidate
  ) LOOP
    v_suffix := v_suffix + 1;
    v_name_candidate := v_name_base || ' ' || v_suffix::TEXT;
  END LOOP;

  SELECT COALESCE(MAX(p.sort_index), -1) + 1
  INTO v_sort_index
  FROM public.profiles p
  WHERE p.user_id = v_user_id;

  INSERT INTO public.profiles AS inserted_profile (
    user_id,
    name,
    primary_color,
    secondary_color,
    sticker_key,
    balance,
    sort_index
  )
  VALUES (
    v_user_id,
    v_name_candidate,
    v_template.primary_color,
    v_template.secondary_color,
    v_template.sticker_key,
    0,
    v_sort_index
  )
  RETURNING inserted_profile.id INTO v_profile_id;

  INSERT INTO public.moments (user_id, name, kind, label, default_stars, sort_index)
  SELECT v_user_id, seed.name, seed.kind, COALESCE(seed.label, seed.name), seed.default_stars, seed.sort_index
  FROM public.profile_template_moments tm
  JOIN public.moments seed
    ON seed.user_id IS NULL
   AND seed.name = tm.moment_name
   AND seed.kind = tm.moment_kind
  WHERE tm.template_key = v_template.template_key
    AND NOT EXISTS (
      SELECT 1
      FROM public.moments owned
      WHERE owned.user_id = v_user_id
        AND owned.name = seed.name
    );

  INSERT INTO public.activities (user_id, name, label, icon, default_stars, sort_index)
  SELECT DISTINCT v_user_id, seed.name, COALESCE(seed.label, seed.name), seed.icon, seed.default_stars, seed.sort_index
  FROM public.profile_template_activities ta
  JOIN public.profile_template_moments tm ON tm.id = ta.template_moment_id
  JOIN public.activities seed
    ON seed.user_id IS NULL
   AND seed.name = ta.activity_name
  WHERE tm.template_key = v_template.template_key
    AND NOT EXISTS (
      SELECT 1
      FROM public.activities owned
      WHERE owned.user_id = v_user_id
        AND owned.name = seed.name
    );

  INSERT INTO public.tasks (user_id, name, label, default_stars, sort_index)
  SELECT DISTINCT v_user_id, seed.name, COALESCE(seed.label, seed.name), seed.default_stars, seed.sort_index
  FROM public.profile_template_tasks tt
  JOIN public.profile_template_activities ta ON ta.id = tt.template_activity_id
  JOIN public.profile_template_moments tm ON tm.id = ta.template_moment_id
  JOIN public.tasks seed
    ON seed.user_id IS NULL
   AND seed.name = tt.task_name
  WHERE tm.template_key = v_template.template_key
    AND NOT EXISTS (
      SELECT 1
      FROM public.tasks owned
      WHERE owned.user_id = v_user_id
        AND owned.name = seed.name
    );

  INSERT INTO public.rewards (user_id, name, sort_index)
  SELECT v_user_id, seed.name, seed.sort_index
  FROM public.profile_template_rewards tr
  JOIN public.rewards seed
    ON seed.user_id IS NULL
   AND seed.name = tr.reward_name
  WHERE tr.template_key = v_template.template_key
    AND NOT EXISTS (
      SELECT 1
      FROM public.rewards owned
      WHERE owned.user_id = v_user_id
        AND owned.name = seed.name
    );

  WITH inserted_moments AS (
    INSERT INTO public.profile_moments AS inserted_profile_moment (
      profile_id,
      moment_id,
      stars,
      sort_index
    )
    SELECT
      v_profile_id,
      m.id,
      tm.stars,
      tm.sort_index
    FROM public.profile_template_moments tm
    JOIN public.moments m
      ON m.user_id = v_user_id
     AND m.name = tm.moment_name
     AND m.kind = tm.moment_kind
    WHERE tm.template_key = v_template.template_key
    ORDER BY tm.sort_index
    RETURNING inserted_profile_moment.id, inserted_profile_moment.moment_id
  ),
  moment_map AS (
    SELECT tm.id AS template_moment_id, im.id AS profile_moment_id
    FROM public.profile_template_moments tm
    JOIN public.moments m
      ON m.user_id = v_user_id
     AND m.name = tm.moment_name
     AND m.kind = tm.moment_kind
    JOIN inserted_moments im ON im.moment_id = m.id
    WHERE tm.template_key = v_template.template_key
  ),
  inserted_activities AS (
    INSERT INTO public.profile_moment_activities AS inserted_profile_moment_activity (
      profile_moment_id,
      activity_id,
      stars,
      sticker_key,
      sort_index
    )
    SELECT
      mm.profile_moment_id,
      a.id,
      ta.stars,
      'star-sticker',
      ta.sort_index
    FROM public.profile_template_activities ta
    JOIN moment_map mm ON mm.template_moment_id = ta.template_moment_id
    JOIN public.activities a
      ON a.user_id = v_user_id
     AND a.name = ta.activity_name
    ORDER BY mm.profile_moment_id, ta.sort_index
    RETURNING inserted_profile_moment_activity.id,
      inserted_profile_moment_activity.profile_moment_id,
      inserted_profile_moment_activity.activity_id
  ),
  activity_map AS (
    SELECT ta.id AS template_activity_id, ia.id AS profile_moment_activity_id
    FROM public.profile_template_activities ta
    JOIN moment_map mm ON mm.template_moment_id = ta.template_moment_id
    JOIN public.activities a
      ON a.user_id = v_user_id
     AND a.name = ta.activity_name
    JOIN inserted_activities ia
      ON ia.profile_moment_id = mm.profile_moment_id
     AND ia.activity_id = a.id
  )
  INSERT INTO public.profile_moment_activity_tasks (
    profile_moment_activity_id,
    task_id,
    stars,
    sort_index
  )
  SELECT
    am.profile_moment_activity_id,
    t.id,
    tt.stars,
    tt.sort_index
  FROM public.profile_template_tasks tt
  JOIN activity_map am ON am.template_activity_id = tt.template_activity_id
  JOIN public.tasks t
    ON t.user_id = v_user_id
   AND t.name = tt.task_name
  ORDER BY am.profile_moment_activity_id, tt.sort_index;

  INSERT INTO public.profile_rewards (
    profile_id,
    reward_id,
    duration_minutes,
    cost_stars,
    sort_index
  )
  SELECT
    v_profile_id,
    r.id,
    tr.duration_minutes,
    tr.cost_stars,
    tr.sort_index
  FROM public.profile_template_rewards tr
  JOIN public.rewards r
    ON r.user_id = v_user_id
   AND r.name = tr.reward_name
  WHERE tr.template_key = v_template.template_key
  ORDER BY tr.sort_index;

  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.name,
    p.primary_color,
    p.secondary_color,
    p.sticker_key,
    p.balance,
    p.sort_index,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = v_profile_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_profile_from_template(TEXT) TO authenticated;
