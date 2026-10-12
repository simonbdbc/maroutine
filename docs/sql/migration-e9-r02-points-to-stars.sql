-- EPIC 9 — E9-R02
-- Migration non destructive: renommage des colonnes `points*` vers `stars*`
-- + mise à jour des fonctions RPC Home pour utiliser les nouveaux noms.
--
-- Date: 2026-03-10
-- Pré-requis: exécuter sur la base v2 actuelle (colonnes `points*` existantes).
--
-- IMPORTANT:
-- - Cette migration modifie les noms exposés par `validate_day` (`earned_stars`).
-- - Le code applicatif doit être aligné dans les tickets suivants (E9-R05+).
-- - Pour verrouiller les stickers activité obligatoires, exécuter ensuite:
--   `docs/sql/migration-e9-r13-pma-sticker-required.sql`.

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Renommage colonnes métier (idempotent)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'moments' AND column_name = 'default_points'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'moments' AND column_name = 'default_stars'
  ) THEN
    EXECUTE 'ALTER TABLE public.moments RENAME COLUMN default_points TO default_stars';
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'default_points'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'default_stars'
  ) THEN
    EXECUTE 'ALTER TABLE public.activities RENAME COLUMN default_points TO default_stars';
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'default_points'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'default_stars'
  ) THEN
    EXECUTE 'ALTER TABLE public.tasks RENAME COLUMN default_points TO default_stars';
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profile_moments' AND column_name = 'points'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profile_moments' AND column_name = 'stars'
  ) THEN
    EXECUTE 'ALTER TABLE public.profile_moments RENAME COLUMN points TO stars';
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profile_moment_activities' AND column_name = 'points'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profile_moment_activities' AND column_name = 'stars'
  ) THEN
    EXECUTE 'ALTER TABLE public.profile_moment_activities RENAME COLUMN points TO stars';
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profile_moment_activity_tasks' AND column_name = 'points'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profile_moment_activity_tasks' AND column_name = 'stars'
  ) THEN
    EXECUTE 'ALTER TABLE public.profile_moment_activity_tasks RENAME COLUMN points TO stars';
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_checks' AND column_name = 'points_earned'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_checks' AND column_name = 'stars_earned'
  ) THEN
    EXECUTE 'ALTER TABLE public.daily_checks RENAME COLUMN points_earned TO stars_earned';
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_validations' AND column_name = 'earned_points'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_validations' AND column_name = 'earned_stars'
  ) THEN
    EXECUTE 'ALTER TABLE public.daily_validations RENAME COLUMN earned_points TO earned_stars';
  END IF;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) Recréer les RPC avec les nouveaux noms de colonnes
-- ─────────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS validate_day(UUID, DATE);
DROP FUNCTION IF EXISTS toggle_moment_check(UUID, UUID, DATE);
DROP FUNCTION IF EXISTS toggle_activity_check(UUID, UUID, DATE);
DROP FUNCTION IF EXISTS toggle_task_check(UUID, UUID, DATE);

CREATE OR REPLACE FUNCTION toggle_task_check(
  p_profile_id UUID,
  p_profile_moment_activity_task_id UUID,
  p_check_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  task_checked BOOLEAN,
  activity_checked BOOLEAN,
  moment_checked BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_check_date DATE := COALESCE(p_check_date, CURRENT_DATE);
  v_now TIMESTAMPTZ := NOW();

  v_profile_moment_activity_id UUID;
  v_profile_moment_id UUID;
  v_task_stars INTEGER := 0;

  v_existing_task_check_id UUID;
  v_existing_task_checked BOOLEAN;

  v_activity_total_tasks INTEGER := 0;
  v_activity_checked_tasks INTEGER := 0;

  v_moment_total_activities INTEGER := 0;
  v_moment_checked_activities INTEGER := 0;
BEGIN
  -- 1) Vérifier la relation task -> activity -> moment -> profile + lock hiérarchie.
  SELECT
    pmat.profile_moment_activity_id,
    pma.profile_moment_id,
    COALESCE(pmat.stars, 0)
  INTO
    v_profile_moment_activity_id,
    v_profile_moment_id,
    v_task_stars
  FROM profile_moment_activity_tasks pmat
  JOIN profile_moment_activities pma ON pma.id = pmat.profile_moment_activity_id
  JOIN profile_moments pm ON pm.id = pma.profile_moment_id
  WHERE pmat.id = p_profile_moment_activity_task_id
    AND pm.profile_id = p_profile_id
  FOR UPDATE OF pmat, pma, pm;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task pivot introuvable pour ce profil'
      USING ERRCODE = 'P0001';
  END IF;

  -- 2) Toggle de la tâche ciblée.
  SELECT dc.id, dc.checked
  INTO v_existing_task_check_id, v_existing_task_checked
  FROM daily_checks dc
  WHERE dc.profile_id = p_profile_id
    AND dc.check_date = v_check_date
    AND dc.target_type = 'task'
    AND dc.profile_moment_activity_task_id = p_profile_moment_activity_task_id
  FOR UPDATE;

  IF FOUND AND v_existing_task_checked THEN
    DELETE FROM daily_checks WHERE id = v_existing_task_check_id;
    task_checked := FALSE;
  ELSE
    INSERT INTO daily_checks (
      profile_id,
      check_date,
      target_type,
      profile_moment_id,
      profile_moment_activity_id,
      profile_moment_activity_task_id,
      checked,
      sticker_key,
      stars_earned,
      checked_at
    )
    VALUES (
      p_profile_id,
      v_check_date,
      'task',
      v_profile_moment_id,
      v_profile_moment_activity_id,
      p_profile_moment_activity_task_id,
      TRUE,
      NULL,
      v_task_stars,
      v_now
    )
    ON CONFLICT (profile_id, check_date, profile_moment_activity_task_id)
    WHERE target_type = 'task'
    DO UPDATE
    SET
      checked = TRUE,
      profile_moment_id = EXCLUDED.profile_moment_id,
      profile_moment_activity_id = EXCLUDED.profile_moment_activity_id,
      sticker_key = EXCLUDED.sticker_key,
      stars_earned = EXCLUDED.stars_earned,
      checked_at = EXCLUDED.checked_at,
      updated_at = NOW();

    task_checked := TRUE;
  END IF;

  -- 3) Recalcul état activity parent:
  --    activity.checked = all(tasks.checked) pour une activité avec tâches.
  SELECT COUNT(*)
  INTO v_activity_total_tasks
  FROM profile_moment_activity_tasks pmat
  WHERE pmat.profile_moment_activity_id = v_profile_moment_activity_id;

  SELECT COUNT(*)
  INTO v_activity_checked_tasks
  FROM profile_moment_activity_tasks pmat
  JOIN daily_checks dc
    ON dc.profile_id = p_profile_id
   AND dc.check_date = v_check_date
   AND dc.target_type = 'task'
   AND dc.profile_moment_activity_task_id = pmat.id
   AND dc.checked = TRUE
  WHERE pmat.profile_moment_activity_id = v_profile_moment_activity_id;

  activity_checked := (v_activity_total_tasks > 0 AND v_activity_checked_tasks = v_activity_total_tasks);

  IF activity_checked THEN
    INSERT INTO daily_checks (
      profile_id,
      check_date,
      target_type,
      profile_moment_id,
      profile_moment_activity_id,
      profile_moment_activity_task_id,
      checked,
      sticker_key,
      stars_earned,
      checked_at
    )
    VALUES (
      p_profile_id,
      v_check_date,
      'activity',
      v_profile_moment_id,
      v_profile_moment_activity_id,
      NULL,
      TRUE,
      NULL,
      0,
      v_now
    )
    ON CONFLICT (profile_id, check_date, profile_moment_activity_id)
    WHERE target_type = 'activity'
    DO UPDATE
    SET
      checked = TRUE,
      profile_moment_id = EXCLUDED.profile_moment_id,
      profile_moment_activity_task_id = NULL,
      sticker_key = NULL,
      stars_earned = 0,
      checked_at = EXCLUDED.checked_at,
      updated_at = NOW();
  ELSE
    DELETE FROM daily_checks
    WHERE profile_id = p_profile_id
      AND check_date = v_check_date
      AND target_type = 'activity'
      AND profile_moment_activity_id = v_profile_moment_activity_id;
  END IF;

  -- 4) Recalcul état moment parent:
  --    moment.checked = all(activities.checked) pour un moment avec activités.
  SELECT COUNT(*)
  INTO v_moment_total_activities
  FROM profile_moment_activities pma
  WHERE pma.profile_moment_id = v_profile_moment_id;

  SELECT COUNT(*)
  INTO v_moment_checked_activities
  FROM profile_moment_activities pma
  WHERE pma.profile_moment_id = v_profile_moment_id
    AND NOT EXISTS (
      SELECT 1
      FROM profile_moment_activity_tasks pmat
      WHERE pmat.profile_moment_activity_id = pma.id
        AND NOT EXISTS (
          SELECT 1
          FROM daily_checks dc_task
          WHERE dc_task.profile_id = p_profile_id
            AND dc_task.check_date = v_check_date
            AND dc_task.target_type = 'task'
            AND dc_task.profile_moment_activity_task_id = pmat.id
            AND dc_task.checked = TRUE
        )
    )
    AND (
      EXISTS (
        SELECT 1
        FROM profile_moment_activity_tasks has_task
        WHERE has_task.profile_moment_activity_id = pma.id
      )
      OR EXISTS (
        SELECT 1
        FROM daily_checks dc_activity
        WHERE dc_activity.profile_id = p_profile_id
          AND dc_activity.check_date = v_check_date
          AND dc_activity.target_type = 'activity'
          AND dc_activity.profile_moment_activity_id = pma.id
          AND dc_activity.checked = TRUE
      )
    );

  moment_checked := (v_moment_total_activities > 0 AND v_moment_checked_activities = v_moment_total_activities);

  IF moment_checked THEN
    INSERT INTO daily_checks (
      profile_id,
      check_date,
      target_type,
      profile_moment_id,
      profile_moment_activity_id,
      profile_moment_activity_task_id,
      checked,
      sticker_key,
      stars_earned,
      checked_at
    )
    VALUES (
      p_profile_id,
      v_check_date,
      'moment',
      v_profile_moment_id,
      NULL,
      NULL,
      TRUE,
      NULL,
      0,
      v_now
    )
    ON CONFLICT (profile_id, check_date, profile_moment_id)
    WHERE target_type = 'moment'
    DO UPDATE
    SET
      checked = TRUE,
      profile_moment_activity_id = NULL,
      profile_moment_activity_task_id = NULL,
      sticker_key = NULL,
      stars_earned = 0,
      checked_at = EXCLUDED.checked_at,
      updated_at = NOW();
  ELSE
    DELETE FROM daily_checks
    WHERE profile_id = p_profile_id
      AND check_date = v_check_date
      AND target_type = 'moment'
      AND profile_moment_id = v_profile_moment_id;
  END IF;

  RETURN QUERY
  SELECT task_checked, activity_checked, moment_checked;
END;
$$;

GRANT EXECUTE ON FUNCTION toggle_task_check(UUID, UUID, DATE) TO authenticated;

-- Toggle atomique d'une activité.
-- Si l'activité a des tâches: cascade check/uncheck sur toutes les tâches.
-- Si l'activité n'a pas de tâche: activité traitée comme feuille checkable.
CREATE OR REPLACE FUNCTION toggle_activity_check(
  p_profile_id UUID,
  p_profile_moment_activity_id UUID,
  p_check_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  activity_checked BOOLEAN,
  moment_checked BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_check_date DATE := COALESCE(p_check_date, CURRENT_DATE);
  v_now TIMESTAMPTZ := NOW();

  v_profile_moment_id UUID;
  v_activity_stars INTEGER := 0;

  v_total_tasks INTEGER := 0;
  v_checked_tasks INTEGER := 0;
  v_is_leaf_activity BOOLEAN := FALSE;
  v_current_activity_checked BOOLEAN := FALSE;
  v_target_activity_checked BOOLEAN := FALSE;

  v_moment_total_activities INTEGER := 0;
  v_moment_checked_activities INTEGER := 0;
BEGIN
  -- 1) Vérifier la relation activity -> moment -> profile + lock hiérarchie.
  SELECT
    pma.profile_moment_id,
    COALESCE(pma.stars, 0)
  INTO
    v_profile_moment_id,
    v_activity_stars
  FROM profile_moment_activities pma
  JOIN profile_moments pm ON pm.id = pma.profile_moment_id
  WHERE pma.id = p_profile_moment_activity_id
    AND pm.profile_id = p_profile_id
  FOR UPDATE OF pma, pm;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Activity pivot introuvable pour ce profil'
      USING ERRCODE = 'P0001';
  END IF;

  -- Lock lignes tâches enfants pour éviter les courses avec toggle_task_check.
  PERFORM 1
  FROM profile_moment_activity_tasks pmat
  WHERE pmat.profile_moment_activity_id = p_profile_moment_activity_id
  FOR UPDATE;

  SELECT COUNT(*)
  INTO v_total_tasks
  FROM profile_moment_activity_tasks pmat
  WHERE pmat.profile_moment_activity_id = p_profile_moment_activity_id;

  v_is_leaf_activity := (v_total_tasks = 0);

  -- 2) État courant (dérivé), puis état cible du toggle.
  IF v_is_leaf_activity THEN
    SELECT EXISTS (
      SELECT 1
      FROM daily_checks dc
      WHERE dc.profile_id = p_profile_id
        AND dc.check_date = v_check_date
        AND dc.target_type = 'activity'
        AND dc.profile_moment_activity_id = p_profile_moment_activity_id
        AND dc.checked = TRUE
    )
    INTO v_current_activity_checked;
  ELSE
    SELECT COUNT(*)
    INTO v_checked_tasks
    FROM profile_moment_activity_tasks pmat
    JOIN daily_checks dc
      ON dc.profile_id = p_profile_id
     AND dc.check_date = v_check_date
     AND dc.target_type = 'task'
     AND dc.profile_moment_activity_task_id = pmat.id
     AND dc.checked = TRUE
    WHERE pmat.profile_moment_activity_id = p_profile_moment_activity_id;

    v_current_activity_checked := (v_total_tasks > 0 AND v_checked_tasks = v_total_tasks);
  END IF;

  v_target_activity_checked := NOT v_current_activity_checked;

  -- 3) Appliquer le toggle.
  IF v_is_leaf_activity THEN
    IF v_target_activity_checked THEN
      INSERT INTO daily_checks (
        profile_id,
        check_date,
        target_type,
        profile_moment_id,
        profile_moment_activity_id,
        profile_moment_activity_task_id,
        checked,
        sticker_key,
        stars_earned,
        checked_at
      )
      VALUES (
        p_profile_id,
        v_check_date,
        'activity',
        v_profile_moment_id,
        p_profile_moment_activity_id,
        NULL,
        TRUE,
        NULL,
        v_activity_stars,
        v_now
      )
      ON CONFLICT (profile_id, check_date, profile_moment_activity_id)
      WHERE target_type = 'activity'
      DO UPDATE
      SET
        checked = TRUE,
        profile_moment_id = EXCLUDED.profile_moment_id,
        profile_moment_activity_task_id = NULL,
        sticker_key = NULL,
        stars_earned = EXCLUDED.stars_earned,
        checked_at = EXCLUDED.checked_at,
        updated_at = NOW();
    ELSE
      DELETE FROM daily_checks
      WHERE profile_id = p_profile_id
        AND check_date = v_check_date
        AND target_type = 'activity'
        AND profile_moment_activity_id = p_profile_moment_activity_id;
    END IF;
  ELSE
    IF v_target_activity_checked THEN
      -- Checker toutes les tâches de l'activité.
      INSERT INTO daily_checks (
        profile_id,
        check_date,
        target_type,
        profile_moment_id,
        profile_moment_activity_id,
        profile_moment_activity_task_id,
        checked,
        sticker_key,
        stars_earned,
        checked_at
      )
      SELECT
        p_profile_id,
        v_check_date,
        'task',
        v_profile_moment_id,
        p_profile_moment_activity_id,
        pmat.id,
        TRUE,
        NULL,
        COALESCE(pmat.stars, 0),
        v_now
      FROM profile_moment_activity_tasks pmat
      WHERE pmat.profile_moment_activity_id = p_profile_moment_activity_id
      ON CONFLICT (profile_id, check_date, profile_moment_activity_task_id)
      WHERE target_type = 'task'
      DO UPDATE
      SET
        checked = TRUE,
        profile_moment_id = EXCLUDED.profile_moment_id,
        profile_moment_activity_id = EXCLUDED.profile_moment_activity_id,
        sticker_key = NULL,
        stars_earned = EXCLUDED.stars_earned,
        checked_at = EXCLUDED.checked_at,
        updated_at = NOW();

      INSERT INTO daily_checks (
        profile_id,
        check_date,
        target_type,
        profile_moment_id,
        profile_moment_activity_id,
        profile_moment_activity_task_id,
        checked,
        sticker_key,
        stars_earned,
        checked_at
      )
      VALUES (
        p_profile_id,
        v_check_date,
        'activity',
        v_profile_moment_id,
        p_profile_moment_activity_id,
        NULL,
        TRUE,
        NULL,
        0,
        v_now
      )
      ON CONFLICT (profile_id, check_date, profile_moment_activity_id)
      WHERE target_type = 'activity'
      DO UPDATE
      SET
        checked = TRUE,
        profile_moment_id = EXCLUDED.profile_moment_id,
        profile_moment_activity_task_id = NULL,
        sticker_key = NULL,
        stars_earned = 0,
        checked_at = EXCLUDED.checked_at,
        updated_at = NOW();
    ELSE
      -- Décocher toute l'activité: tâches + état activité.
      DELETE FROM daily_checks
      WHERE profile_id = p_profile_id
        AND check_date = v_check_date
        AND target_type = 'task'
        AND profile_moment_activity_id = p_profile_moment_activity_id;

      DELETE FROM daily_checks
      WHERE profile_id = p_profile_id
        AND check_date = v_check_date
        AND target_type = 'activity'
        AND profile_moment_activity_id = p_profile_moment_activity_id;
    END IF;
  END IF;

  -- 4) Recalcul état activity final (source unique pour le retour + cohérence).
  IF v_is_leaf_activity THEN
    SELECT EXISTS (
      SELECT 1
      FROM daily_checks dc
      WHERE dc.profile_id = p_profile_id
        AND dc.check_date = v_check_date
        AND dc.target_type = 'activity'
        AND dc.profile_moment_activity_id = p_profile_moment_activity_id
        AND dc.checked = TRUE
    )
    INTO activity_checked;
  ELSE
    SELECT COUNT(*)
    INTO v_checked_tasks
    FROM profile_moment_activity_tasks pmat
    JOIN daily_checks dc
      ON dc.profile_id = p_profile_id
     AND dc.check_date = v_check_date
     AND dc.target_type = 'task'
     AND dc.profile_moment_activity_task_id = pmat.id
     AND dc.checked = TRUE
    WHERE pmat.profile_moment_activity_id = p_profile_moment_activity_id;

    activity_checked := (v_total_tasks > 0 AND v_checked_tasks = v_total_tasks);

    IF activity_checked THEN
      INSERT INTO daily_checks (
        profile_id,
        check_date,
        target_type,
        profile_moment_id,
        profile_moment_activity_id,
        profile_moment_activity_task_id,
        checked,
        sticker_key,
        stars_earned,
        checked_at
      )
      VALUES (
        p_profile_id,
        v_check_date,
        'activity',
        v_profile_moment_id,
        p_profile_moment_activity_id,
        NULL,
        TRUE,
        NULL,
        0,
        v_now
      )
      ON CONFLICT (profile_id, check_date, profile_moment_activity_id)
      WHERE target_type = 'activity'
      DO UPDATE
      SET
        checked = TRUE,
        profile_moment_id = EXCLUDED.profile_moment_id,
        profile_moment_activity_task_id = NULL,
        sticker_key = NULL,
        stars_earned = 0,
        checked_at = EXCLUDED.checked_at,
        updated_at = NOW();
    ELSE
      DELETE FROM daily_checks
      WHERE profile_id = p_profile_id
        AND check_date = v_check_date
        AND target_type = 'activity'
        AND profile_moment_activity_id = p_profile_moment_activity_id;
    END IF;
  END IF;

  -- 5) Recalcul état moment parent.
  SELECT COUNT(*)
  INTO v_moment_total_activities
  FROM profile_moment_activities pma
  WHERE pma.profile_moment_id = v_profile_moment_id;

  SELECT COUNT(*)
  INTO v_moment_checked_activities
  FROM profile_moment_activities pma
  WHERE pma.profile_moment_id = v_profile_moment_id
    AND NOT EXISTS (
      SELECT 1
      FROM profile_moment_activity_tasks pmat
      WHERE pmat.profile_moment_activity_id = pma.id
        AND NOT EXISTS (
          SELECT 1
          FROM daily_checks dc_task
          WHERE dc_task.profile_id = p_profile_id
            AND dc_task.check_date = v_check_date
            AND dc_task.target_type = 'task'
            AND dc_task.profile_moment_activity_task_id = pmat.id
            AND dc_task.checked = TRUE
        )
    )
    AND (
      EXISTS (
        SELECT 1
        FROM profile_moment_activity_tasks has_task
        WHERE has_task.profile_moment_activity_id = pma.id
      )
      OR EXISTS (
        SELECT 1
        FROM daily_checks dc_activity
        WHERE dc_activity.profile_id = p_profile_id
          AND dc_activity.check_date = v_check_date
          AND dc_activity.target_type = 'activity'
          AND dc_activity.profile_moment_activity_id = pma.id
          AND dc_activity.checked = TRUE
      )
    );

  moment_checked := (v_moment_total_activities > 0 AND v_moment_checked_activities = v_moment_total_activities);

  IF moment_checked THEN
    INSERT INTO daily_checks (
      profile_id,
      check_date,
      target_type,
      profile_moment_id,
      profile_moment_activity_id,
      profile_moment_activity_task_id,
      checked,
      sticker_key,
      stars_earned,
      checked_at
    )
    VALUES (
      p_profile_id,
      v_check_date,
      'moment',
      v_profile_moment_id,
      NULL,
      NULL,
      TRUE,
      NULL,
      0,
      v_now
    )
    ON CONFLICT (profile_id, check_date, profile_moment_id)
    WHERE target_type = 'moment'
    DO UPDATE
    SET
      checked = TRUE,
      profile_moment_activity_id = NULL,
      profile_moment_activity_task_id = NULL,
      sticker_key = NULL,
      stars_earned = 0,
      checked_at = EXCLUDED.checked_at,
      updated_at = NOW();
  ELSE
    DELETE FROM daily_checks
    WHERE profile_id = p_profile_id
      AND check_date = v_check_date
      AND target_type = 'moment'
      AND profile_moment_id = v_profile_moment_id;
  END IF;

  RETURN QUERY
  SELECT activity_checked, moment_checked;
END;
$$;

GRANT EXECUTE ON FUNCTION toggle_activity_check(UUID, UUID, DATE) TO authenticated;


-- Validation atomique de la journée:
-- - calcule les stars gagnées depuis les feuilles checkées
--   (tâches + activités sans tâche),
-- - crédite le solde du profil,
-- - reset les checks du jour,
-- - garantit l'idempotence via daily_validations.
CREATE OR REPLACE FUNCTION validate_day(
  p_profile_id UUID,
  p_check_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  earned_stars INTEGER,
  new_balance INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_check_date DATE := COALESCE(p_check_date, CURRENT_DATE);
  v_now TIMESTAMPTZ := NOW();

  v_existing_earned_stars INTEGER := 0;
  v_existing_new_balance INTEGER := 0;

  v_current_balance INTEGER := 0;
  v_earned_stars INTEGER := 0;
  v_new_balance INTEGER := 0;
BEGIN
  -- 1) Idempotence: si déjà validé pour ce profil/date, renvoyer le résultat stable.
  SELECT dv.earned_stars, dv.new_balance
  INTO v_existing_earned_stars, v_existing_new_balance
  FROM daily_validations dv
  WHERE dv.profile_id = p_profile_id
    AND dv.check_date = v_check_date
  FOR UPDATE;

  IF FOUND THEN
    RETURN QUERY
    SELECT v_existing_earned_stars, v_existing_new_balance;
    RETURN;
  END IF;

  -- 2) Lock du profil (barrière de concurrence sur le crédit de solde).
  SELECT p.balance
  INTO v_current_balance
  FROM profiles p
  WHERE p.id = p_profile_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil introuvable'
      USING ERRCODE = 'P0001';
  END IF;

  -- Re-check idempotence après lock (cas de course).
  SELECT dv.earned_stars, dv.new_balance
  INTO v_existing_earned_stars, v_existing_new_balance
  FROM daily_validations dv
  WHERE dv.profile_id = p_profile_id
    AND dv.check_date = v_check_date;

  IF FOUND THEN
    RETURN QUERY
    SELECT v_existing_earned_stars, v_existing_new_balance;
    RETURN;
  END IF;

  -- 3) Calcul stars gagnés du jour depuis les feuilles checkables.
  SELECT COALESCE(SUM(dc.stars_earned), 0)
  INTO v_earned_stars
  FROM daily_checks dc
  WHERE dc.profile_id = p_profile_id
    AND dc.check_date = v_check_date
    AND dc.checked = TRUE
    AND (
      dc.target_type = 'task'
      OR (
        dc.target_type = 'activity'
        AND NOT EXISTS (
          SELECT 1
          FROM profile_moment_activity_tasks pmat
          WHERE pmat.profile_moment_activity_id = dc.profile_moment_activity_id
        )
      )
    );

  v_new_balance := v_current_balance + v_earned_stars;

  -- 4) Créditer le solde (une seule fois).
  UPDATE profiles
  SET balance = v_new_balance
  WHERE id = p_profile_id;

  -- 5) Reset checks du jour.
  DELETE FROM daily_checks
  WHERE profile_id = p_profile_id
    AND check_date = v_check_date;

  -- 6) Persistance idempotence (résultat stable pour les retries).
  INSERT INTO daily_validations (
    profile_id,
    check_date,
    earned_stars,
    new_balance,
    validated_at
  )
  VALUES (
    p_profile_id,
    v_check_date,
    v_earned_stars,
    v_new_balance,
    v_now
  )
  ON CONFLICT (profile_id, check_date) DO NOTHING;

  SELECT dv.earned_stars, dv.new_balance
  INTO v_existing_earned_stars, v_existing_new_balance
  FROM daily_validations dv
  WHERE dv.profile_id = p_profile_id
    AND dv.check_date = v_check_date;

  RETURN QUERY
  SELECT v_existing_earned_stars, v_existing_new_balance;
END;
$$;

GRANT EXECUTE ON FUNCTION validate_day(UUID, DATE) TO authenticated;

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) Vérification post-migration (lecture seule)
-- ─────────────────────────────────────────────────────────────────────────────
-- Résultats attendus:
-- - Aucune colonne legacy `points*` / `earned_points`.
-- - Toutes les colonnes `stars*` attendues présentes.
-- - 0 incohérence sur les valeurs et sur `daily_checks.stars_earned`.
-- - RPC disponibles: toggle_task_check, toggle_activity_check, validate_day.
-- - RPC supprimée: toggle_moment_check absente.

-- 3.1 Colonnes legacy (doit retourner 0 ligne)
SELECT c.table_name, c.column_name
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name IN (
    'moments',
    'activities',
    'tasks',
    'profile_moments',
    'profile_moment_activities',
    'profile_moment_activity_tasks',
    'daily_checks',
    'daily_validations'
  )
  AND c.column_name IN ('default_points', 'points', 'points_earned', 'earned_points')
ORDER BY c.table_name, c.column_name;

-- 3.2 Colonnes stars attendues manquantes (doit retourner 0 ligne)
WITH expected(table_name, column_name) AS (
  VALUES
    ('moments', 'default_stars'),
    ('activities', 'default_stars'),
    ('tasks', 'default_stars'),
    ('profile_moments', 'stars'),
    ('profile_moment_activities', 'stars'),
    ('profile_moment_activity_tasks', 'stars'),
    ('daily_checks', 'stars_earned'),
    ('daily_validations', 'earned_stars')
)
SELECT e.table_name, e.column_name
FROM expected e
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = e.table_name
 AND c.column_name = e.column_name
WHERE c.column_name IS NULL
ORDER BY e.table_name, e.column_name;

-- 3.3 Valeurs négatives (doit retourner 0 pour chaque ligne)
SELECT 'profile_moments.stars' AS metric, COUNT(*) AS invalid_rows
FROM profile_moments
WHERE stars < 0
UNION ALL
SELECT 'profile_moment_activities.stars' AS metric, COUNT(*) AS invalid_rows
FROM profile_moment_activities
WHERE stars < 0
UNION ALL
SELECT 'profile_moment_activity_tasks.stars' AS metric, COUNT(*) AS invalid_rows
FROM profile_moment_activity_tasks
WHERE stars < 0
UNION ALL
SELECT 'daily_checks.stars_earned' AS metric, COUNT(*) AS invalid_rows
FROM daily_checks
WHERE stars_earned < 0
UNION ALL
SELECT 'daily_validations.earned_stars' AS metric, COUNT(*) AS invalid_rows
FROM daily_validations
WHERE earned_stars < 0;

-- 3.4 Cohérence `daily_checks.stars_earned` (doit retourner 0 partout)
SELECT
  COUNT(*) FILTER (
    WHERE dc.target_type = 'task'
      AND dc.checked = TRUE
      AND COALESCE(dc.stars_earned, 0) <> COALESCE(task_pivot.stars, 0)
  ) AS task_checked_mismatch,
  COUNT(*) FILTER (
    WHERE dc.target_type = 'activity'
      AND dc.checked = TRUE
      AND EXISTS (
        SELECT 1
        FROM profile_moment_activity_tasks has_task
        WHERE has_task.profile_moment_activity_id = dc.profile_moment_activity_id
      )
      AND COALESCE(dc.stars_earned, 0) <> 0
  ) AS activity_with_tasks_non_zero,
  COUNT(*) FILTER (
    WHERE dc.target_type = 'activity'
      AND dc.checked = TRUE
      AND NOT EXISTS (
        SELECT 1
        FROM profile_moment_activity_tasks has_task
        WHERE has_task.profile_moment_activity_id = dc.profile_moment_activity_id
      )
      AND COALESCE(dc.stars_earned, 0) <> COALESCE(activity_pivot.stars, 0)
  ) AS activity_without_tasks_mismatch,
  COUNT(*) FILTER (
    WHERE dc.target_type = 'moment'
      AND dc.checked = TRUE
      AND COALESCE(dc.stars_earned, 0) <> 0
  ) AS moment_non_zero
FROM daily_checks dc
LEFT JOIN profile_moment_activity_tasks task_pivot
  ON task_pivot.id = dc.profile_moment_activity_task_id
LEFT JOIN profile_moment_activities activity_pivot
  ON activity_pivot.id = dc.profile_moment_activity_id;

-- 3.5 RPC disponibles (doit retourner 3 lignes)
SELECT p.proname AS function_name
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('toggle_task_check', 'toggle_activity_check', 'validate_day')
ORDER BY p.proname;

-- 3.6 RPC supprimée (doit retourner 0 ligne)
SELECT p.proname AS function_name
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'toggle_moment_check';
