-- EPIC 15 — E15-U01
-- Migration non destructive: aligner les defaults SQL sticker_key
-- sur le fallback image unifié "stars-icon".
--
-- Date: 2026-03-27
-- Pré-requis:
-- - schéma v2 déjà en place.

BEGIN;

-- 1) Nettoyage défensif des données invalides existantes.
UPDATE public.profiles
SET sticker_key = 'stars-icon'
WHERE sticker_key IS NULL
   OR btrim(sticker_key) = '';

UPDATE public.profile_moment_activities
SET sticker_key = 'stars-icon'
WHERE sticker_key IS NULL
   OR btrim(sticker_key) = '';

-- 2) Defaults SQL alignés fallback unifié.
ALTER TABLE public.profiles
  ALTER COLUMN sticker_key SET DEFAULT 'stars-icon';

ALTER TABLE public.profile_moment_activities
  ALTER COLUMN sticker_key SET DEFAULT 'stars-icon';

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- Vérification post-migration (lecture seule)
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT table_name, column_name, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name IN ('profiles', 'profile_moment_activities')
--   AND column_name = 'sticker_key'
-- ORDER BY table_name;
--
-- Résultat attendu:
-- - 2 lignes
-- - column_default contient 'stars-icon' pour les 2 tables
