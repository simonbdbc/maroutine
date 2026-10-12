-- EPIC 9 — E9-R13
-- Migration non destructive: rendre `profile_moment_activities.sticker_key`
-- obligatoire et non vide.
--
-- Date: 2026-03-10
-- Pré-requis:
-- - schéma v2 déjà en place.
-- - migration stars (E9-R02) déjà appliquée si la base vient d'une version legacy.
--
-- Effets:
-- - backfill des valeurs NULL/vides -> 'stars-icon'
-- - DEFAULT 'stars-icon'
-- - NOT NULL
-- - CHECK trim(sticker_key) <> ''

BEGIN;

-- 1) Backfill des données existantes invalides.
UPDATE public.profile_moment_activities
SET sticker_key = 'stars-icon'
WHERE sticker_key IS NULL
   OR btrim(sticker_key) = '';

-- 2) DEFAULT stable pour toute nouvelle activité.
ALTER TABLE public.profile_moment_activities
  ALTER COLUMN sticker_key SET DEFAULT 'stars-icon';

-- 3) NOT NULL (idempotent).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profile_moment_activities'
      AND column_name = 'sticker_key'
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.profile_moment_activities
      ALTER COLUMN sticker_key SET NOT NULL;
  END IF;
END;
$$;

-- 4) CHECK "non vide" (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pma_sticker_key_not_blank'
      AND conrelid = 'public.profile_moment_activities'::regclass
  ) THEN
    ALTER TABLE public.profile_moment_activities
      ADD CONSTRAINT pma_sticker_key_not_blank
      CHECK (btrim(sticker_key) <> '');
  END IF;
END;
$$;

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- Vérification post-migration (lecture seule)
-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Contrôle colonne + default + nullabilité
-- SELECT column_name, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'profile_moment_activities'
--   AND column_name = 'sticker_key';
--
-- Résultat attendu:
-- - is_nullable = 'NO'
-- - column_default contient 'stars-icon'
--
-- 2) Contrôle contrainte CHECK
-- SELECT conname, pg_get_constraintdef(c.oid) AS definition
-- FROM pg_constraint c
-- WHERE c.conrelid = 'public.profile_moment_activities'::regclass
--   AND c.conname = 'pma_sticker_key_not_blank';
--
-- Résultat attendu:
-- - 1 ligne avec CHECK (btrim(sticker_key) <> ''::text)
--
-- 3) Contrôle données invalides résiduelles
-- SELECT COUNT(*) AS invalid_count
-- FROM public.profile_moment_activities
-- WHERE sticker_key IS NULL OR btrim(sticker_key) = '';
--
-- Résultat attendu:
-- - invalid_count = 0
