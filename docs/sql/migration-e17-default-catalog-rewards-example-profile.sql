-- E17 — Catalogues par défaut + récompenses globales + profil exemple.
--
-- Pré-requis:
-- 1. Exécuter `docs/sql/export-test-catalog-example-snapshot.sql`
--    dans Supabase SQL Editor.
-- 2. Copier la valeur `snapshot_insert_sql` dans la section ci-dessous.
--
-- Cette migration ne modifie pas les catalogues déjà copiés chez les utilisateurs.
-- Elle remplace uniquement les seeds globaux `user_id IS NULL` et ajoute le
-- template de profil utilisé par `create_profile_from_template()`.
BEGIN;
CREATE TEMP TABLE _e17_snapshot (data jsonb NOT NULL) ON COMMIT DROP;
-- ─────────────────────────────────────────────────────────────────────────────
-- Coller ici la ligne générée par `export-test-catalog-example-snapshot.sql`.
-- Exemple attendu:
-- INSERT INTO _e17_snapshot(data) VALUES ($snapshot${...}$snapshot$::jsonb);
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO _e17_snapshot(data)
VALUES (
    $snapshot$ { "catalog": { "tasks": [{"name": "Manger ses céréales", "label": "Manger ses céréales", "sort_index": 0, "default_stars": 0}, {"name": "Débarrasser son bol", "label": "Débarrasser son bol", "sort_index": 2, "default_stars": 0}, {"name": "Mettre ses chaussettes", "label": "Mettre ses chaussettes", "sort_index": 3, "default_stars": 0}, {"name": "Mettre ses chaussures", "label": "Mettre ses chaussures", "sort_index": 4, "default_stars": 0}, {"name": "Mettre son manteau", "label": "Mettre son manteau", "sort_index": 5, "default_stars": 0}, {"name": "Se laver le visage", "label": "Se laver le visage", "sort_index": 7, "default_stars": 0}, {"name": "Se coiffer", "label": "Se coiffer", "sort_index": 8, "default_stars": 0}, {"name": "Ranger ses jouets", "label": "Ranger ses jouets", "sort_index": 9, "default_stars": 0}, {"name": "Ranger son bureau", "label": "Ranger son bureau", "sort_index": 10, "default_stars": 0}, {"name": "Faire son lit", "label": "Faire son lit", "sort_index": 11, "default_stars": 0}, {"name": "S'occuper de son linge", "label": "S'occuper de son linge", "sort_index": 12, "default_stars": 0}, {"name": "Faire ses devoirs", "label": "Faire ses devoirs", "sort_index": 13, "default_stars": 0}, {"name": "Ranger son cartable", "label": "Ranger son cartable", "sort_index": 14, "default_stars": 0}, {"name": "Brosser les dents (2 min)", "label": "Brosser les dents (2 min)", "sort_index": 15, "default_stars": 0}, {"name": "Ranger ses habits sales", "label": "Ranger ses habits sales", "sort_index": 16, "default_stars": 0}, {"name": "Mettre son pyjama", "label": "Mettre son pyjama", "sort_index": 17, "default_stars": 0}, {"name": "Dire bonne nuit", "label": "Dire bonne nuit", "sort_index": 18, "default_stars": 0}, {"name": "Manger ses légumes", "label": "Manger ses légumes", "sort_index": 19, "default_stars": 0}, {"name": "Débarrasser son assiette", "label": "Débarrasser son assiette", "sort_index": 20, "default_stars": 0}, {"name": "Boire son lait", "label": "Boire son lait", "sort_index": 21, "default_stars": 0}, {"name": "Manger un gâteau", "label": "Manger un gâteau", "sort_index": 22, "default_stars": 0}, {"name": "Manger un fruit ou une compote", "label": "Manger un fruit ou une compote", "sort_index": 23, "default_stars": 0}, {"name": "Passer aux toilettes", "label": "Passer aux toilettes", "sort_index": 24, "default_stars": 0}],
    "moments": [{"kind": "morning", "name": "Matin", "label": "Le réveil et le départ", "sort_index": 0, "default_stars": 0}, {"kind": "noon", "name": "Midi", "label": "Le repas du midi", "sort_index": 1, "default_stars": 0}, {"kind": "afternoon", "name": "Après-midi", "label": "Le temps libre", "sort_index": 2, "default_stars": 0}, {"kind": "evening", "name": "Soir", "label": "Le coucher", "sort_index": 3, "default_stars": 0}, {"kind": "morning", "name": "Temps-libre", "label": "Temps-libre", "sort_index": 4, "default_stars": 0}],
    "rewards": [{"name": "Dessin animé", "sort_index": 0}, {"name": "Tablette", "sort_index": 1}, {"name": "Switch", "sort_index": 2}],
    "activities": [{"icon": "restaurant", "name": "Petit Déjeuner", "label": "Manger le matin", "sort_index": 0, "default_stars": 0}, {"icon": "checkroom", "name": "S'habiller", "label": "Mettre ses vêtements", "sort_index": 1, "default_stars": 0}, {"icon": "wash", "name": "Se laver", "label": "Hygiène du matin", "sort_index": 2, "default_stars": 0}, {"icon": "home", "name": "Ranger sa chambre", "label": "Rangement quotidien", "sort_index": 3, "default_stars": 0}, {"icon": "menu_book", "name": "Devoirs", "label": "Travail scolaire", "sort_index": 4, "default_stars": 0}, {"icon": "auto_fix_high", "name": "Brossage & Bain", "label": "Hygiène du soir", "sort_index": 5, "default_stars": 0}, {"icon": "bedtime", "name": "Se coucher", "label": "Aller au lit à l'heure", "sort_index": 6, "default_stars": 0}, {"icon": "lunch_dining", "name": "Déjeuner", "label": "Repas du midi", "sort_index": 7, "default_stars": 0}, {"icon": "cake", "name": "Goûter", "label": "Collation de l'après-midi", "sort_index": 8, "default_stars": 0}, {"icon": null, "name": "Se laver les mains", "label": "Se laver les mains", "sort_index": 9, "default_stars": 0}, {"icon": null, "name": "Faire sa toilette", "label": "Brossage des dents", "sort_index": 10, "default_stars": 0}, {"icon": null, "name": "Bonus journée complète", "label": "Bonus journée complète", "sort_index": 11, "default_stars": 0}] },
    "template": { "key": "example",
    "name": "Exemple",
    "moments": [{"stars": 0, "activities": [{"stars": 0, "tasks": [{"stars": 1, "task_name": "Manger ses céréales", "sort_index": 0}, {"stars": 1, "task_name": "Débarrasser son bol", "sort_index": 1}],
    "sort_index": 0,
    "sticker_key": "star-sticker",
    "activity_name": "Petit Déjeuner" },
    { "stars": 0,
    "tasks": [{"stars": 1, "task_name": "Brosser les dents (2 min)", "sort_index": 0}, {"stars": 1, "task_name": "Se laver le visage", "sort_index": 1}, {"stars": 1, "task_name": "Se coiffer", "sort_index": 2}],
    "sort_index": 1,
    "sticker_key": "star-sticker",
    "activity_name": "Faire sa toilette" },
    { "stars": 1,
    "tasks": [],
    "sort_index": 2,
    "sticker_key": "star-sticker",
    "activity_name": "S'habiller" } ],
    "sort_index": 0,
    "moment_kind": "morning",
    "moment_name": "Matin" },
    { "stars": 0,
    "activities": [{"stars": 1, "tasks": [],
    "sort_index": 0,
    "sticker_key": "star-sticker",
    "activity_name": "Se laver les mains" },
    { "stars": 0,
    "tasks": [{"stars": 1, "task_name": "Débarrasser son assiette", "sort_index": 0}],
    "sort_index": 1,
    "sticker_key": "star-sticker",
    "activity_name": "Déjeuner" } ],
    "sort_index": 1,
    "moment_kind": "noon",
    "moment_name": "Midi" },
    { "stars": 0,
    "activities": [{"stars": 0, "tasks": [{"stars": 1, "task_name": "Manger un fruit ou une compote", "sort_index": 0}, {"stars": 1, "task_name": "Manger un gâteau", "sort_index": 1}],
    "sort_index": 0,
    "sticker_key": "star-sticker",
    "activity_name": "Goûter" } ],
    "sort_index": 2,
    "moment_kind": "afternoon",
    "moment_name": "Après-midi" },
    { "stars": 0,
    "activities": [{"stars": 3, "tasks": [],
    "sort_index": 0,
    "sticker_key": "star-sticker",
    "activity_name": "Devoirs" },
    { "stars": 0,
    "tasks": [{"stars": 1, "task_name": "Faire son lit", "sort_index": 0}, {"stars": 1, "task_name": "Ranger ses jouets", "sort_index": 1}, {"stars": 1, "task_name": "Ranger son bureau", "sort_index": 2}, {"stars": 1, "task_name": "S'occuper de son linge", "sort_index": 3}],
    "sort_index": 1,
    "sticker_key": "star-sticker",
    "activity_name": "Ranger sa chambre" } ],
    "sort_index": 3,
    "moment_kind": "morning",
    "moment_name": "Temps-libre" },
    { "stars": 0,
    "activities": [{"stars": 0, "tasks": [{"stars": 1, "task_name": "Brosser les dents (2 min)", "sort_index": 0}],
    "sort_index": 0,
    "sticker_key": "star-sticker",
    "activity_name": "Faire sa toilette" },
    { "stars": 0,
    "tasks": [{"stars": 1, "task_name": "Mettre son pyjama", "sort_index": 0}, {"stars": 1, "task_name": "Passer aux toilettes", "sort_index": 1}, {"stars": 1, "task_name": "Dire bonne nuit", "sort_index": 2}],
    "sort_index": 1,
    "sticker_key": "star-sticker",
    "activity_name": "Se coucher" },
    { "stars": 4,
    "tasks": [],
    "sort_index": 2,
    "sticker_key": "star-sticker",
    "activity_name": "Bonus journée complète" } ],
    "sort_index": 4,
    "moment_kind": "evening",
    "moment_name": "Soir" } ],
    "rewards": [{"cost_stars": 30, "sort_index": 0, "reward_name": "Switch", "duration_minutes": 20}, {"cost_stars": 20, "sort_index": 1, "reward_name": "Tablette", "duration_minutes": 20}, {"cost_stars": 10, "sort_index": 2, "reward_name": "Dessin animé", "duration_minutes": 20}],
    "sticker_key": "star-sticker",
    "primary_color": "#EC4899",
    "secondary_color": "#B388FF" } } $snapshot$::jsonb
  );
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM _e17_snapshot
) THEN RAISE EXCEPTION 'Snapshot E17 manquant. Exécute export-test-catalog-example-snapshot.sql puis colle snapshot_insert_sql dans cette migration.';
END IF;
END $$;
ALTER TABLE public.rewards
ALTER COLUMN user_id DROP NOT NULL;
CREATE TABLE IF NOT EXISTS public.profile_templates (
  template_key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  primary_color TEXT NOT NULL DEFAULT '#FF6B6B',
  secondary_color TEXT NOT NULL DEFAULT '#FFD700',
  sticker_key TEXT NOT NULL DEFAULT 'star-sticker',
  sort_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profile_templates_key_not_blank CHECK (btrim(template_key) <> ''),
  CONSTRAINT profile_templates_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT profile_templates_sticker_key_not_blank CHECK (btrim(sticker_key) <> '')
);
CREATE TABLE IF NOT EXISTS public.profile_template_moments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_key TEXT NOT NULL REFERENCES public.profile_templates(template_key) ON DELETE CASCADE,
  moment_name TEXT NOT NULL,
  moment_kind TEXT NOT NULL CHECK (
    moment_kind IN ('morning', 'noon', 'afternoon', 'evening')
  ),
  stars INTEGER NOT NULL DEFAULT 0,
  sort_index INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT profile_template_moments_name_not_blank CHECK (btrim(moment_name) <> ''),
  CONSTRAINT profile_template_moments_unique UNIQUE (template_key, moment_name)
);
CREATE TABLE IF NOT EXISTS public.profile_template_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_moment_id UUID NOT NULL REFERENCES public.profile_template_moments(id) ON DELETE CASCADE,
  activity_name TEXT NOT NULL,
  stars INTEGER NOT NULL DEFAULT 0,
  sticker_key TEXT NOT NULL DEFAULT 'star-sticker',
  sort_index INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT profile_template_activities_name_not_blank CHECK (btrim(activity_name) <> ''),
  CONSTRAINT profile_template_activities_sticker_key_not_blank CHECK (btrim(sticker_key) <> ''),
  CONSTRAINT profile_template_activities_unique UNIQUE (template_moment_id, activity_name)
);
CREATE TABLE IF NOT EXISTS public.profile_template_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_activity_id UUID NOT NULL REFERENCES public.profile_template_activities(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  stars INTEGER NOT NULL DEFAULT 0,
  sort_index INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT profile_template_tasks_name_not_blank CHECK (btrim(task_name) <> ''),
  CONSTRAINT profile_template_tasks_unique UNIQUE (template_activity_id, task_name)
);
CREATE TABLE IF NOT EXISTS public.profile_template_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_key TEXT NOT NULL REFERENCES public.profile_templates(template_key) ON DELETE CASCADE,
  reward_name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  cost_stars INTEGER NOT NULL,
  sort_index INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT profile_template_rewards_name_not_blank CHECK (btrim(reward_name) <> ''),
  CONSTRAINT profile_template_rewards_positive_duration CHECK (duration_minutes > 0),
  CONSTRAINT profile_template_rewards_positive_cost CHECK (cost_stars > 0),
  CONSTRAINT profile_template_rewards_unique UNIQUE (template_key, reward_name)
);
CREATE INDEX IF NOT EXISTS ix_profile_template_moments_template ON public.profile_template_moments(template_key, sort_index);
CREATE INDEX IF NOT EXISTS ix_profile_template_activities_moment ON public.profile_template_activities(template_moment_id, sort_index);
CREATE INDEX IF NOT EXISTS ix_profile_template_tasks_activity ON public.profile_template_tasks(template_activity_id, sort_index);
CREATE INDEX IF NOT EXISTS ix_profile_template_rewards_template ON public.profile_template_rewards(template_key, sort_index);
DROP TRIGGER IF EXISTS trg_profile_templates_updated_at ON public.profile_templates;
CREATE TRIGGER trg_profile_templates_updated_at BEFORE
UPDATE ON public.profile_templates FOR EACH ROW EXECUTE FUNCTION set_updated_at();
ALTER TABLE public.profile_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_template_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_template_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_template_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_template_rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profile_templates_select_all" ON public.profile_templates;
DROP POLICY IF EXISTS "profile_template_moments_select_all" ON public.profile_template_moments;
DROP POLICY IF EXISTS "profile_template_activities_select_all" ON public.profile_template_activities;
DROP POLICY IF EXISTS "profile_template_tasks_select_all" ON public.profile_template_tasks;
DROP POLICY IF EXISTS "profile_template_rewards_select_all" ON public.profile_template_rewards;
CREATE POLICY "profile_templates_select_all" ON public.profile_templates FOR
SELECT USING (true);
CREATE POLICY "profile_template_moments_select_all" ON public.profile_template_moments FOR
SELECT USING (true);
CREATE POLICY "profile_template_activities_select_all" ON public.profile_template_activities FOR
SELECT USING (true);
CREATE POLICY "profile_template_tasks_select_all" ON public.profile_template_tasks FOR
SELECT USING (true);
CREATE POLICY "profile_template_rewards_select_all" ON public.profile_template_rewards FOR
SELECT USING (true);
DROP POLICY IF EXISTS "rewards_select_own" ON public.rewards;
CREATE POLICY "rewards_select_own" ON public.rewards FOR
SELECT USING (
    user_id IS NULL
    OR auth.uid() = user_id
  );
CREATE OR REPLACE FUNCTION public.initialize_user_catalog(p_user_id UUID) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_claimed_user_id UUID;
BEGIN IF p_user_id IS NULL THEN RETURN FALSE;
END IF;
INSERT INTO public.user_catalog_states (user_id)
VALUES (p_user_id) ON CONFLICT (user_id) DO NOTHING
RETURNING user_id INTO v_claimed_user_id;
IF v_claimed_user_id IS NULL THEN RETURN FALSE;
END IF;
INSERT INTO public.moments (
    user_id,
    name,
    kind,
    label,
    default_stars,
    sort_index
  )
SELECT p_user_id,
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
INSERT INTO public.activities (
    user_id,
    name,
    label,
    icon,
    default_stars,
    sort_index
  )
SELECT p_user_id,
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
SELECT p_user_id,
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
INSERT INTO public.rewards (user_id, name, sort_index)
SELECT p_user_id,
  seed.name,
  seed.sort_index
FROM public.rewards seed
WHERE seed.user_id IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.rewards owned
    WHERE owned.user_id = p_user_id
      AND owned.name = seed.name
  );
RETURN TRUE;
END;
$$;
CREATE OR REPLACE FUNCTION public.create_profile_from_template(p_template_key TEXT DEFAULT 'example') RETURNS TABLE (
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
  ) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_id UUID := auth.uid();
v_template public.profile_templates %ROWTYPE;
v_profile_id UUID;
v_name_base TEXT;
v_name_candidate TEXT;
v_suffix INTEGER := 1;
v_sort_index INTEGER := 0;
BEGIN IF v_user_id IS NULL THEN RAISE EXCEPTION 'Non authentifié' USING ERRCODE = 'P0001';
END IF;
PERFORM public.initialize_user_catalog(v_user_id);
SELECT * INTO v_template
FROM public.profile_templates
WHERE template_key = COALESCE(NULLIF(btrim(p_template_key), ''), 'example');
IF NOT FOUND THEN RAISE EXCEPTION 'Template de profil introuvable' USING ERRCODE = 'P0001';
END IF;
v_name_base := COALESCE(NULLIF(btrim(v_template.name), ''), 'Exemple');
v_name_candidate := v_name_base;
WHILE EXISTS (
  SELECT 1
  FROM public.profiles p
  WHERE p.user_id = v_user_id
    AND p.name = v_name_candidate
) LOOP v_suffix := v_suffix + 1;
v_name_candidate := v_name_base || ' ' || v_suffix::TEXT;
END LOOP;
SELECT COALESCE(MAX(p.sort_index), -1) + 1 INTO v_sort_index
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
INSERT INTO public.moments (
    user_id,
    name,
    kind,
    label,
    default_stars,
    sort_index
  )
SELECT v_user_id,
  seed.name,
  seed.kind,
  COALESCE(seed.label, seed.name),
  seed.default_stars,
  seed.sort_index
FROM public.profile_template_moments tm
  JOIN public.moments seed ON seed.user_id IS NULL
  AND seed.name = tm.moment_name
  AND seed.kind = tm.moment_kind
WHERE tm.template_key = v_template.template_key
  AND NOT EXISTS (
    SELECT 1
    FROM public.moments owned
    WHERE owned.user_id = v_user_id
      AND owned.name = seed.name
  );
INSERT INTO public.activities (
    user_id,
    name,
    label,
    icon,
    default_stars,
    sort_index
  )
SELECT DISTINCT v_user_id,
  seed.name,
  COALESCE(seed.label, seed.name),
  seed.icon,
  seed.default_stars,
  seed.sort_index
FROM public.profile_template_activities ta
  JOIN public.profile_template_moments tm ON tm.id = ta.template_moment_id
  JOIN public.activities seed ON seed.user_id IS NULL
  AND seed.name = ta.activity_name
WHERE tm.template_key = v_template.template_key
  AND NOT EXISTS (
    SELECT 1
    FROM public.activities owned
    WHERE owned.user_id = v_user_id
      AND owned.name = seed.name
  );
INSERT INTO public.tasks (user_id, name, label, default_stars, sort_index)
SELECT DISTINCT v_user_id,
  seed.name,
  COALESCE(seed.label, seed.name),
  seed.default_stars,
  seed.sort_index
FROM public.profile_template_tasks tt
  JOIN public.profile_template_activities ta ON ta.id = tt.template_activity_id
  JOIN public.profile_template_moments tm ON tm.id = ta.template_moment_id
  JOIN public.tasks seed ON seed.user_id IS NULL
  AND seed.name = tt.task_name
WHERE tm.template_key = v_template.template_key
  AND NOT EXISTS (
    SELECT 1
    FROM public.tasks owned
    WHERE owned.user_id = v_user_id
      AND owned.name = seed.name
  );
INSERT INTO public.rewards (user_id, name, sort_index)
SELECT v_user_id,
  seed.name,
  seed.sort_index
FROM public.profile_template_rewards tr
  JOIN public.rewards seed ON seed.user_id IS NULL
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
  SELECT v_profile_id,
    m.id,
    tm.stars,
    tm.sort_index
  FROM public.profile_template_moments tm
    JOIN public.moments m ON m.user_id = v_user_id
    AND m.name = tm.moment_name
    AND m.kind = tm.moment_kind
  WHERE tm.template_key = v_template.template_key
  ORDER BY tm.sort_index
  RETURNING inserted_profile_moment.id,
    inserted_profile_moment.moment_id
),
moment_map AS (
  SELECT tm.id AS template_moment_id,
    im.id AS profile_moment_id
  FROM public.profile_template_moments tm
    JOIN public.moments m ON m.user_id = v_user_id
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
  SELECT mm.profile_moment_id,
    a.id,
    ta.stars,
    'star-sticker',
    ta.sort_index
  FROM public.profile_template_activities ta
    JOIN moment_map mm ON mm.template_moment_id = ta.template_moment_id
    JOIN public.activities a ON a.user_id = v_user_id
    AND a.name = ta.activity_name
  ORDER BY mm.profile_moment_id,
    ta.sort_index
  RETURNING inserted_profile_moment_activity.id,
    inserted_profile_moment_activity.profile_moment_id,
    inserted_profile_moment_activity.activity_id
),
activity_map AS (
  SELECT ta.id AS template_activity_id,
    ia.id AS profile_moment_activity_id
  FROM public.profile_template_activities ta
    JOIN moment_map mm ON mm.template_moment_id = ta.template_moment_id
    JOIN public.activities a ON a.user_id = v_user_id
    AND a.name = ta.activity_name
    JOIN inserted_activities ia ON ia.profile_moment_id = mm.profile_moment_id
    AND ia.activity_id = a.id
)
INSERT INTO public.profile_moment_activity_tasks (
    profile_moment_activity_id,
    task_id,
    stars,
    sort_index
  )
SELECT am.profile_moment_activity_id,
  t.id,
  tt.stars,
  tt.sort_index
FROM public.profile_template_tasks tt
  JOIN activity_map am ON am.template_activity_id = tt.template_activity_id
  JOIN public.tasks t ON t.user_id = v_user_id
  AND t.name = tt.task_name
ORDER BY am.profile_moment_activity_id,
  tt.sort_index;
INSERT INTO public.profile_rewards (
    profile_id,
    reward_id,
    duration_minutes,
    cost_stars,
    sort_index
  )
SELECT v_profile_id,
  r.id,
  tr.duration_minutes,
  tr.cost_stars,
  tr.sort_index
FROM public.profile_template_rewards tr
  JOIN public.rewards r ON r.user_id = v_user_id
  AND r.name = tr.reward_name
WHERE tr.template_key = v_template.template_key
ORDER BY tr.sort_index;
RETURN QUERY
SELECT p.id,
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
DELETE FROM public.profile_templates
WHERE template_key = (
    SELECT data#>>'{template,key}'
    FROM _e17_snapshot
    LIMIT 1
  );
WITH snapshot_items AS (
  SELECT item.*
  FROM _e17_snapshot snapshot
    CROSS JOIN LATERAL jsonb_to_recordset(snapshot.data#>'{catalog,moments}') AS item(
      name TEXT,
      kind TEXT,
      label TEXT,
      default_stars INTEGER,
      sort_index INTEGER
    )
)
UPDATE public.moments seed
SET kind = snapshot_items.kind,
  label = snapshot_items.label,
  default_stars = snapshot_items.default_stars,
  sort_index = snapshot_items.sort_index
FROM snapshot_items
WHERE seed.user_id IS NULL
  AND seed.name = snapshot_items.name;
WITH snapshot_items AS (
  SELECT item.*
  FROM _e17_snapshot snapshot
    CROSS JOIN LATERAL jsonb_to_recordset(snapshot.data#>'{catalog,moments}') AS item(
      name TEXT,
      kind TEXT,
      label TEXT,
      default_stars INTEGER,
      sort_index INTEGER
    )
)
INSERT INTO public.moments (
    user_id,
    name,
    kind,
    label,
    default_stars,
    sort_index
  )
SELECT NULL,
  name,
  kind,
  label,
  default_stars,
  sort_index
FROM snapshot_items
WHERE NOT EXISTS (
    SELECT 1
    FROM public.moments seed
    WHERE seed.user_id IS NULL
      AND seed.name = snapshot_items.name
  );
DELETE FROM public.moments seed
WHERE seed.user_id IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM _e17_snapshot snapshot
      CROSS JOIN LATERAL jsonb_to_recordset(snapshot.data#>'{catalog,moments}') AS item(name TEXT)
    WHERE item.name = seed.name
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.profile_moments pm
    WHERE pm.moment_id = seed.id
  );
WITH snapshot_items AS (
  SELECT item.*
  FROM _e17_snapshot snapshot
    CROSS JOIN LATERAL jsonb_to_recordset(snapshot.data#>'{catalog,activities}') AS item(
      name TEXT,
      label TEXT,
      icon TEXT,
      default_stars INTEGER,
      sort_index INTEGER
    )
)
UPDATE public.activities seed
SET label = snapshot_items.label,
  icon = snapshot_items.icon,
  default_stars = snapshot_items.default_stars,
  sort_index = snapshot_items.sort_index
FROM snapshot_items
WHERE seed.user_id IS NULL
  AND seed.name = snapshot_items.name;
WITH snapshot_items AS (
  SELECT item.*
  FROM _e17_snapshot snapshot
    CROSS JOIN LATERAL jsonb_to_recordset(snapshot.data#>'{catalog,activities}') AS item(
      name TEXT,
      label TEXT,
      icon TEXT,
      default_stars INTEGER,
      sort_index INTEGER
    )
)
INSERT INTO public.activities (
    user_id,
    name,
    label,
    icon,
    default_stars,
    sort_index
  )
SELECT NULL,
  name,
  label,
  icon,
  default_stars,
  sort_index
FROM snapshot_items
WHERE NOT EXISTS (
    SELECT 1
    FROM public.activities seed
    WHERE seed.user_id IS NULL
      AND seed.name = snapshot_items.name
  );
DELETE FROM public.activities seed
WHERE seed.user_id IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM _e17_snapshot snapshot
      CROSS JOIN LATERAL jsonb_to_recordset(snapshot.data#>'{catalog,activities}') AS item(name TEXT)
    WHERE item.name = seed.name
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.profile_moment_activities pma
    WHERE pma.activity_id = seed.id
  );
WITH snapshot_items AS (
  SELECT item.*
  FROM _e17_snapshot snapshot
    CROSS JOIN LATERAL jsonb_to_recordset(snapshot.data#>'{catalog,tasks}') AS item(
      name TEXT,
      label TEXT,
      default_stars INTEGER,
      sort_index INTEGER
    )
)
UPDATE public.tasks seed
SET label = snapshot_items.label,
  default_stars = snapshot_items.default_stars,
  sort_index = snapshot_items.sort_index
FROM snapshot_items
WHERE seed.user_id IS NULL
  AND seed.name = snapshot_items.name;
WITH snapshot_items AS (
  SELECT item.*
  FROM _e17_snapshot snapshot
    CROSS JOIN LATERAL jsonb_to_recordset(snapshot.data#>'{catalog,tasks}') AS item(
      name TEXT,
      label TEXT,
      default_stars INTEGER,
      sort_index INTEGER
    )
)
INSERT INTO public.tasks (user_id, name, label, default_stars, sort_index)
SELECT NULL,
  name,
  label,
  default_stars,
  sort_index
FROM snapshot_items
WHERE NOT EXISTS (
    SELECT 1
    FROM public.tasks seed
    WHERE seed.user_id IS NULL
      AND seed.name = snapshot_items.name
  );
DELETE FROM public.tasks seed
WHERE seed.user_id IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM _e17_snapshot snapshot
      CROSS JOIN LATERAL jsonb_to_recordset(snapshot.data#>'{catalog,tasks}') AS item(name TEXT)
    WHERE item.name = seed.name
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.profile_moment_activity_tasks pmat
    WHERE pmat.task_id = seed.id
  );
WITH snapshot_items AS (
  SELECT item.*
  FROM _e17_snapshot snapshot
    CROSS JOIN LATERAL jsonb_to_recordset(snapshot.data#>'{catalog,rewards}') AS item(name TEXT, sort_index INTEGER)
)
UPDATE public.rewards seed
SET sort_index = snapshot_items.sort_index
FROM snapshot_items
WHERE seed.user_id IS NULL
  AND seed.name = snapshot_items.name;
WITH snapshot_items AS (
  SELECT item.*
  FROM _e17_snapshot snapshot
    CROSS JOIN LATERAL jsonb_to_recordset(snapshot.data#>'{catalog,rewards}') AS item(name TEXT, sort_index INTEGER)
)
INSERT INTO public.rewards (user_id, name, sort_index)
SELECT NULL,
  name,
  sort_index
FROM snapshot_items
WHERE NOT EXISTS (
    SELECT 1
    FROM public.rewards seed
    WHERE seed.user_id IS NULL
      AND seed.name = snapshot_items.name
  );
DELETE FROM public.rewards seed
WHERE seed.user_id IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM _e17_snapshot snapshot
      CROSS JOIN LATERAL jsonb_to_recordset(snapshot.data#>'{catalog,rewards}') AS item(name TEXT)
    WHERE item.name = seed.name
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.profile_rewards pr
    WHERE pr.reward_id = seed.id
  );
INSERT INTO public.profile_templates (
    template_key,
    name,
    primary_color,
    secondary_color,
    sticker_key,
    sort_index
  )
SELECT snapshot.data#>>'{template,key}',
  snapshot.data#>>'{template,name}',
  snapshot.data#>>'{template,primary_color}',
  snapshot.data#>>'{template,secondary_color}',
  'star-sticker',
  0
FROM _e17_snapshot snapshot;
INSERT INTO public.profile_template_moments (
    template_key,
    moment_name,
    moment_kind,
    stars,
    sort_index
  )
SELECT snapshot.data#>>'{template,key}',
  item.moment_name,
  item.moment_kind,
  item.stars,
  item.sort_index
FROM _e17_snapshot snapshot
  CROSS JOIN LATERAL jsonb_to_recordset(snapshot.data#>'{template,moments}') AS item(
    moment_name TEXT,
    moment_kind TEXT,
    stars INTEGER,
    sort_index INTEGER,
    activities JSONB
  );
INSERT INTO public.profile_template_activities (
    template_moment_id,
    activity_name,
    stars,
    sticker_key,
    sort_index
  )
SELECT template_moment.id,
  item.activity_name,
  item.stars,
  'star-sticker',
  item.sort_index
FROM _e17_snapshot snapshot
  CROSS JOIN LATERAL jsonb_to_recordset(snapshot.data#>'{template,moments}') AS moment_item(
    moment_name TEXT,
    moment_kind TEXT,
    stars INTEGER,
    sort_index INTEGER,
    activities JSONB
  )
  JOIN public.profile_template_moments template_moment ON template_moment.template_key = snapshot.data#>>'{template,key}'
  AND template_moment.moment_name = moment_item.moment_name
  CROSS JOIN LATERAL jsonb_to_recordset(moment_item.activities) AS item(
    activity_name TEXT,
    stars INTEGER,
    sticker_key TEXT,
    sort_index INTEGER,
    tasks JSONB
  );
INSERT INTO public.profile_template_tasks (
    template_activity_id,
    task_name,
    stars,
    sort_index
  )
SELECT template_activity.id,
  item.task_name,
  item.stars,
  item.sort_index
FROM _e17_snapshot snapshot
  CROSS JOIN LATERAL jsonb_to_recordset(snapshot.data#>'{template,moments}') AS moment_item(
    moment_name TEXT,
    moment_kind TEXT,
    stars INTEGER,
    sort_index INTEGER,
    activities JSONB
  )
  JOIN public.profile_template_moments template_moment ON template_moment.template_key = snapshot.data#>>'{template,key}'
  AND template_moment.moment_name = moment_item.moment_name
  CROSS JOIN LATERAL jsonb_to_recordset(moment_item.activities) AS activity_item(
    activity_name TEXT,
    stars INTEGER,
    sticker_key TEXT,
    sort_index INTEGER,
    tasks JSONB
  )
  JOIN public.profile_template_activities template_activity ON template_activity.template_moment_id = template_moment.id
  AND template_activity.activity_name = activity_item.activity_name
  CROSS JOIN LATERAL jsonb_to_recordset(activity_item.tasks) AS item(
    task_name TEXT,
    stars INTEGER,
    sort_index INTEGER
  );
INSERT INTO public.profile_template_rewards (
    template_key,
    reward_name,
    duration_minutes,
    cost_stars,
    sort_index
  )
SELECT snapshot.data#>>'{template,key}',
  item.reward_name,
  item.duration_minutes,
  item.cost_stars,
  item.sort_index
FROM _e17_snapshot snapshot
  CROSS JOIN LATERAL jsonb_to_recordset(snapshot.data#>'{template,rewards}') AS item(
    reward_name TEXT,
    duration_minutes INTEGER,
    cost_stars INTEGER,
    sort_index INTEGER
  );
COMMIT;
